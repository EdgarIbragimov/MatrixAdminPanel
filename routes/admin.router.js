import express from "express";
import dataManager from "../data/datamanager.js";

const adminRouter = express.Router();

// Определяем функцию для получения класса бейджа в зависимости от статуса
function getStatusBadgeClass(status) {
  const statusClasses = {
    unverified: "warning",
    active: "success",
    blocked: "danger",
  };
  return statusClasses[status] || "secondary";
}

adminRouter.get("/userslist", async (req, res) => {
  try {
    const userslist = await dataManager.getUsersData();
    console.log("Полученные пользователи:", userslist);
    res.render("admin/userslist", {
      userslist: userslist || [],
      getStatusBadgeClass, // Передаём функцию в шаблон
    });
  } catch (error) {
    console.error("Ошибка получения пользователей:", error);
    res.render("admin/userslist", { userslist: [], getStatusBadgeClass });
  }
});

adminRouter.put("/userslist/:id", async (req, res) => {
  try {
    const updatedUser = await dataManager.updateUserData(
      req.params.id,
      req.body
    );
    if (updatedUser) {
      res.status(200).json(updatedUser);
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    res.status(500).send("Server error");
  }
});
export default adminRouter;
