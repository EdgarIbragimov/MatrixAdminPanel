import express from "express";
import dataManager from "../data/datamanager.js";

const adminRouter = express.Router();

adminRouter.get("/userslist", async (req, res) => {
  try {
    const userslist = await dataManager.getUsersData();
    //console.log("Полученные пользователи:", userslist);
    res.render("admin/userslist", {
      userslist: userslist || [],
      protocol: req.protocol,
    });
  } catch (error) {
    console.error("Ошибка получения пользователей:", error);
    res.render("admin/userslist", { userslist: [] });
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
    const friends = await dataManager.getUserFriendsWithDetails(req.params.id);
    res.render("admin/user_friends", {
      friends:
        friends.map((friend) => ({
          ...friend.userData,
          status: friend.status,
        })) || [],
    });
  } catch (error) {
    console.error("Ошибка получения друзей:", error);
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
    res.status(500).json({ success: false });
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
      user: user,
    });
  } catch (error) {
    console.error("Ошибка при загрузке постов:", error);
    res.status(500).send("Ошибка сервера");
  }
});

// Маркировка поста как удаленного
adminRouter.put("/posts/:postId/markDeleted", async (req, res) => {
  try {
    const { postId } = req.params;

    const success = await dataManager.markPostAsDeleted(postId);

    if (success) {
      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ error: "Пост не найден" });
    }
  } catch (error) {
    console.error("Ошибка при маркировке поста как удаленного:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Восстановление удаленного поста
adminRouter.put("/posts/:postId/restore", async (req, res) => {
  try {
    const { postId } = req.params;

    const success = await dataManager.restorePost(postId);

    if (success) {
      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ error: "Пост не найден" });
    }
  } catch (error) {
    console.error("Ошибка при восстановлении поста:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Блокировка поста
adminRouter.put("/posts/:postId/block", async (req, res) => {
  try {
    const { postId } = req.params;

    const success = await dataManager.blockPost(postId);

    if (success) {
      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ error: "Пост не найден" });
    }
  } catch (error) {
    console.error("Ошибка при блокировке поста:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Разблокировка поста
adminRouter.put("/posts/:postId/unblock", async (req, res) => {
  try {
    const { postId } = req.params;

    const success = await dataManager.unblockPost(postId);

    if (success) {
      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ error: "Пост не найден" });
    }
  } catch (error) {
    console.error("Ошибка при разблокировке поста:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

export default adminRouter;
