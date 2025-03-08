import express from "express";
import dataManager from "../data/datamanager.js";

const adminRouter = express.Router();

adminRouter.get("/userslist", async (req, res) => {
  try {
    const users = await dataManager.getUsersData();
    res.render("admin/users_list", { users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Server error");
  }
});

adminRouter.put("/userslist/:id", async (req, res) => {
  try {
    const updatedUser = await dataManager.updateUser(req.params.id, req.body);
    if (updatedUser) {
      res.status(200).json(updatedUser);
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    res.status(500).send("Server error");
  }
});

adminRouter.get("/userslist/:id/friends", async (req, res) => {
  try {
    const userId = req.params.id;
    const friends = await dataManager.getUserFriendsWithDetails(userId);
    res.render("admin/user_friends", {
      friends:
        friends.map((friend) => ({
          ...friend.userData,
          status: friend.status,
          friendId: friend.friendId,
        })) || [],
      currentUserId: userId,
    });
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.render("admin/user_friends", { friends: [] });
  }
});

adminRouter.delete("/userslist/:userId/friends", async (req, res) => {
  try {
    const result = await dataManager.removeFriend(
      req.params.userId,
      req.body.friendId
    );
    res.status(200).json({ success: !!result });
  } catch (error) {
    console.error("Error removing friend:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

adminRouter.get("/userslist/:id/feed", async (req, res) => {
  try {
    const userId = req.params.id;
    const feedPosts = await dataManager.getUserFeedPosts(userId);
    const user = (await dataManager.getUsersByIds([userId]))[0];

    res.render("admin/feed", {
      posts: feedPosts,
      currentUserId: userId,
      user,
    });
  } catch (error) {
    console.error("Error loading posts:", error);
    res.status(500).send("Server error");
  }
});

// API routes for post actions
adminRouter.post("/api/posts/:postId/:action", async (req, res) => {
  try {
    const { postId, action } = req.params;

    // Validate action
    const validActions = ["delete", "restore", "block", "unblock"];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid action. Supported actions: delete, restore, block, unblock",
      });
    }

    let success = false;
    let message = "";

    // Process action
    switch (action) {
      case "delete":
        success = await dataManager.markPostAsDeleted(postId);
        message = "Post deleted successfully";
        break;
      case "restore":
        success = await dataManager.restorePost(postId);
        message = "Post restored successfully";
        break;
      case "block":
        success = await dataManager.blockPost(postId);
        message = "Post blocked successfully";
        break;
      case "unblock":
        success = await dataManager.unblockPost(postId);
        message = "Post unblocked successfully";
        break;
    }

    if (success) {
      res.status(200).json({ success: true, message });
    } else {
      res.status(404).json({
        success: false,
        message: "Post not found or action could not be completed",
      });
    }
  } catch (error) {
    console.error(`Error processing post action:`, error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while processing the action",
    });
  }
});

// Удаление комментария
adminRouter.delete("/posts/:postId/comments/:commentId", async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    if (!postId || !commentId) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters: postId and commentId",
      });
    }

    const success = await dataManager.deleteComment(postId, commentId);

    if (success) {
      res.status(200).json({
        success: true,
        message: "Comment deleted successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        error: "Post or comment not found",
      });
    }
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({
      success: false,
      error: "Server error occurred while deleting comment",
    });
  }
});

// Обновление данных пользователя
adminRouter.put("/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = req.body;

    // Validate required fields
    if (!userData.fullname || !userData.email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const updatedUser = await dataManager.updateUser(userId, userData);

    if (updatedUser) {
      res.status(200).json({ success: true, user: updatedUser });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default adminRouter;
