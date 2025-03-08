import { promises as fs } from "fs";
import { fileURLToPath } from "url";
import path, { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirnamePath = dirname(__filename);

const PATHS = {
  friends: path.join(__dirnamePath, "/friends/friends.json"),
  users: path.join(__dirnamePath, "/users/users.json"),
  news: path.join(__dirnamePath, "/news/news.json"),
};

class DataManager {
  constructor() {
    this.cache = {
      friends: null,
      users: null,
      news: null,
    };
  }

  // ===== UTILITY METHODS =====

  async readJSONFile(filePath) {
    try {
      const data = await fs.readFile(filePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return [];
    }
  }

  async writeJSONFile(filePath, data) {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`Error writing file ${filePath}:`, error);
      return false;
    }
  }

  clearCache() {
    this.cache = {
      friends: null,
      users: null,
      news: null,
    };
  }

  // ===== DATA LOADING METHODS =====

  async getUsersData() {
    if (!this.cache.users) {
      this.cache.users = await this.readJSONFile(PATHS.users);
    }
    return this.cache.users;
  }

  async getNewsData() {
    if (!this.cache.news) {
      this.cache.news = await this.readJSONFile(PATHS.news);
    }
    return this.cache.news;
  }

  async getFriendsData() {
    if (!this.cache.friends) {
      this.cache.friends = await this.readJSONFile(PATHS.friends);
    }
    return this.cache.friends;
  }

  // ===== USER METHODS =====

  async getUsersByIds(userIds) {
    const users = await this.getUsersData();
    return users.filter((user) => userIds.includes(user.id));
  }

  async updateUser(userId, userData) {
    const users = await this.getUsersData();
    const userIndex = users.findIndex((user) => user.id === userId);

    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...userData };
      const success = await this.writeJSONFile(PATHS.users, users);
      if (success) {
        this.cache.users = users;
        return users[userIndex];
      }
    }
    return null;
  }

  // ===== FRIENDSHIP METHODS =====

  async getUserFriendsWithDetails(userId) {
    try {
      // Ensure users are loaded in cache
      if (!this.cache.users) {
        await this.getUsersData();
      }

      const friendsData = await this.getFriendsData();
      const userFriendsList = friendsData.find(
        (entry) => entry.userId === userId
      );

      if (!userFriendsList) return [];

      // Return friends with their full user details
      return userFriendsList.friends.map((friend) => ({
        ...friend,
        userData: this.cache.users.find((u) => u.id === friend.friendId) || {
          fullname: "Unknown User",
        },
      }));
    } catch (error) {
      console.error("Error getting friends with details:", error);
      return [];
    }
  }

  async getAcceptedFriendUsers(userId) {
    const friendsData = await this.getFriendsData();
    const userFriendsList = friendsData.find(
      (entry) => entry.userId === userId
    );

    if (!userFriendsList) return [];

    // Get IDs of accepted friends only
    const friendIds = userFriendsList.friends
      .filter((friend) => friend.status === "accepted")
      .map((friend) => friend.friendId);

    // Return the actual user objects
    return this.getUsersByIds(friendIds);
  }

  async addFriend(userId, friendId) {
    const friendsData = await this.getFriendsData();
    const currentDate = new Date().toISOString().split("T")[0];

    // Find or create user entry
    let userEntry = friendsData.find((entry) => entry.userId === userId);
    if (!userEntry) {
      userEntry = { userId, friends: [] };
      friendsData.push(userEntry);
    }

    // Check if friend is already in the list
    const existingFriend = userEntry.friends.find(
      (f) => f.friendId === friendId
    );
    if (existingFriend) {
      return false; // Friend already exists
    }

    // Add friend to user's list
    userEntry.friends.push({
      friendId,
      status: "pending",
      dateAdded: currentDate,
    });

    const success = await this.writeJSONFile(PATHS.friends, friendsData);
    if (success) {
      this.cache.friends = friendsData;
      return true;
    }
    return false;
  }

  async updateFriendStatus(userId, friendId, newStatus) {
    const friendsData = await this.getFriendsData();
    const userEntry = friendsData.find((entry) => entry.userId === userId);

    if (!userEntry) return false;

    const friendRelation = userEntry.friends.find(
      (f) => f.friendId === friendId
    );
    if (!friendRelation) return false;

    friendRelation.status = newStatus;

    const success = await this.writeJSONFile(PATHS.friends, friendsData);
    if (success) {
      this.cache.friends = friendsData;
      return true;
    }
    return false;
  }

  async removeFriend(userId, friendId) {
    const friendsData = await this.getFriendsData();
    const userEntry = friendsData.find((entry) => entry.userId === userId);

    if (!userEntry) return false;

    // Find the index of the friend
    const friendIndex = userEntry.friends.findIndex(
      (f) => f.friendId === friendId
    );
    if (friendIndex === -1) return false;

    // Remove the friend
    userEntry.friends.splice(friendIndex, 1);

    const success = await this.writeJSONFile(PATHS.friends, friendsData);
    if (success) {
      this.cache.friends = friendsData;
      return true;
    }
    return false;
  }

  // ===== POST/NEWS METHODS =====

  async createPost(userId, content) {
    const newsData = await this.getNewsData();
    const newPost = {
      id: `news-${Date.now()}`,
      userId,
      content,
      date: new Date().toISOString(),
      likes: [],
      comments: [],
      isDeleted: false,
    };

    newsData.push(newPost);
    const success = await this.writeJSONFile(PATHS.news, newsData);
    if (success) {
      this.cache.news = newsData;
      return newPost;
    }
    return null;
  }

  async markPostAsDeleted(postId) {
    const newsData = await this.getNewsData();
    const postIndex = newsData.findIndex((post) => post.id === postId);

    if (postIndex === -1) return false;

    newsData[postIndex].isDeleted = true;
    const success = await this.writeJSONFile(PATHS.news, newsData);
    if (success) {
      this.cache.news = newsData;
      return true;
    }
    return false;
  }

  async blockPost(postId) {
    const newsData = await this.getNewsData();
    const postIndex = newsData.findIndex((post) => post.id === postId);

    if (postIndex === -1) return false;

    newsData[postIndex].isBlocked = true;
    const success = await this.writeJSONFile(PATHS.news, newsData);
    if (success) {
      this.cache.news = newsData;
      return true;
    }
    return false;
  }

  async unblockPost(postId) {
    const newsData = await this.getNewsData();
    const postIndex = newsData.findIndex((post) => post.id === postId);

    if (postIndex === -1) return false;

    newsData[postIndex].isBlocked = false;
    const success = await this.writeJSONFile(PATHS.news, newsData);
    if (success) {
      this.cache.news = newsData;
      return true;
    }
    return false;
  }

  async restorePost(postId) {
    const newsData = await this.getNewsData();
    const postIndex = newsData.findIndex((post) => post.id === postId);

    if (postIndex === -1) return false;

    newsData[postIndex].isDeleted = false;
    const success = await this.writeJSONFile(PATHS.news, newsData);
    if (success) {
      this.cache.news = newsData;
      return true;
    }
    return false;
  }

  async deleteComment(postId, commentId) {
    const newsData = await this.getNewsData();
    const postIndex = newsData.findIndex((post) => post.id === postId);

    if (postIndex === -1) return false;

    const commentIndex = newsData[postIndex].comments.findIndex(
      (comment) => comment.id === commentId
    );

    if (commentIndex === -1) return false;

    // Remove comment
    newsData[postIndex].comments.splice(commentIndex, 1);

    const success = await this.writeJSONFile(PATHS.news, newsData);
    if (success) {
      this.cache.news = newsData;
      return true;
    }
    return false;
  }

  async getAllPostsWithUserInfo() {
    const newsData = await this.getNewsData();
    const users = await this.getUsersData();

    return newsData
      .map((post) => {
        const user = users.find((u) => u.id === post.userId);
        return {
          ...post,
          userName: user ? user.fullname : "Unknown User",
          userPhoto: user ? user.photo : null,
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  async getUserPosts(userId) {
    try {
      const newsData = await this.getNewsData();
      const userPosts = newsData.filter((post) => post.userId === userId);
      return userPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.error("Error getting user posts:", error);
      throw error;
    }
  }

  async getUserFeedPosts(userId) {
    const friends = await this.getAcceptedFriendUsers(userId);
    const friendIds = friends.map((friend) => friend.id);
    const newsData = await this.getNewsData();
    const users = await this.getUsersData();

    // Get posts from user and friends
    const feedPosts = newsData
      .filter(
        (post) => post.userId === userId || friendIds.includes(post.userId)
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    // Add user info to posts and process comments
    return feedPosts.map((post) => {
      const user = users.find((u) => u.id === post.userId);

      // Process comments to add user info
      const commentsWithUserInfo = (post.comments || []).map((comment) => {
        const commentUser = users.find((u) => u.id === comment.userId);
        return {
          ...comment,
          userName: commentUser
            ? commentUser.fullname
            : "Неизвестный пользователь",
          userPhoto: commentUser ? commentUser.photo : null,
        };
      });

      return {
        ...post,
        userName: user ? user.fullname : "Неизвестный пользователь",
        userPhoto: user ? user.photo : null,
        isDeleted: post.isDeleted || false,
        isBlocked: post.isBlocked || false,
        comments: commentsWithUserInfo,
      };
    });
  }
}

const dataManager = new DataManager();
export default dataManager;
