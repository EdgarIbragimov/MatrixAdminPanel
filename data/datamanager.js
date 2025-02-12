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

  async getFriendsData() {
    if (!this.cache.friends) {
      this.cache.friends = await this.readJSONFile(PATHS.friends);
    }
    return this.cache.friends;
  }

  async getUsersData() {
    if (!this.cache.users) {
      this.cache.users = await this.readJSONFile(PATHS.users);
    }
    //console.log('Loaded users:', this.cache.users);
    return this.cache.users;
  }

  async getNewsData() {
    if (!this.cache.news) {
      this.cache.news = await this.readJSONFile(PATHS.news);
    }
    return this.cache.news;
  }

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

  async getUserFriends(userId) {
    const friendsData = await this.getFriendsData();
    const userFriendsList = friendsData.find(
      (entry) => entry.userId === userId
    );
    if (!userFriendsList) return [];

    const friendIds = userFriendsList.friends
      .filter((friend) => friend.status === "accepted")
      .map((friend) => friend.friendId);

    return this.getUsersByIds(friendIds);
  }

  async addFriend(userId, friendId) {
    const friendsData = await this.getFriendsData();
    const currentDate = new Date().toISOString().split("T")[0];

    // Add friend to user's list
    let userEntry = friendsData.find((entry) => entry.userId === userId);
    if (!userEntry) {
      userEntry = { userId, friends: [] };
      friendsData.push(userEntry);
    }

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
    if (friendRelation) {
      friendRelation.status = newStatus;

      const success = await this.writeJSONFile(PATHS.friends, friendsData);
      if (success) {
        this.cache.friends = friendsData;
        return true;
      }
    }
    return false;
  }

  async getUserNewsFeed(userId) {
    const friends = await this.getUserFriends(userId);
    const friendIds = friends.map((friend) => friend.id);
    const newsData = await this.getNewsData();

    return newsData
      .filter(
        (post) => post.userId === userId || friendIds.includes(post.userId)
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  async createPost(userId, content) {
    const newsData = await this.getNewsData();
    const newPost = {
      id: `news-${Date.now()}`,
      userId,
      content,
      date: new Date().toISOString(),
      likes: [],
      comments: [],
    };

    newsData.push(newPost);
    const success = await this.writeJSONFile(PATHS.news, newsData);
    if (success) {
      this.cache.news = newsData;
      return newPost;
    }
    return null;
  }

  async getAllPosts() {
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

  clearCache() {
    this.cache = {
      friends: null,
      users: null,
      news: null,
    };
  }
}

const dataManager = new DataManager();
export default dataManager;
