/**
 * MATRIX ADMIN PANEL - Main JavaScript File
 * This file contains all the client-side functionality for the admin panel
 */

$(function () {
  // Get current user ID from hidden field (if exists)
  const currentUserId = $("#currentUserId").val() || null;

  // Initialize the feed functionality if we're on the feed page
  if ($("#currentUserId").length > 0) {
    initPostsFeed();
  }

  // Setup online/offline status monitoring
  setupConnectionMonitoring();

  /**
   * ====================================================
   * CONNECTION MONITORING
   * ====================================================
   */

  /**
   * Monitor online/offline status and inform user of changes
   */
  function setupConnectionMonitoring() {
    // Add offline indicator to the page
    if ($(".offline-indicator").length === 0) {
      $("body").prepend(
        '<div class="offline-indicator">You are offline. Some features are unavailable.</div>'
      );
    }

    // Handle online event
    window.addEventListener("online", function () {
      $("body").removeClass("offline");
      showUserMessage("You are back online", "success");
    });

    // Handle offline event
    window.addEventListener("offline", function () {
      $("body").addClass("offline");
      showUserMessage(
        "You are offline. Some features are unavailable.",
        "warning"
      );
    });

    // Set initial state
    if (!navigator.onLine) {
      $("body").addClass("offline");
    }
  }

  /**
   * ====================================================
   * USER NAVIGATION & ACTIONS
   * ====================================================
   */

  // Navigate to user's friends page
  $(document).on("click", ".user-friends", function () {
    navigateToUserSection($(this).data("id"), "friends");
  });

  // Navigate to user's feed page
  $(document).on("click", ".user-feed", function () {
    navigateToUserSection($(this).data("id"), "feed");
  });

  // Delete friend relationship
  $(document).on("click", ".delete-friend-btn", function () {
    const $btn = $(this);
    const friendRow = $btn.closest(".friend-row");
    const friendId = $btn.data("friend-id");
    const userId = $("#currentUserId").val();

    if (friendId && userId && confirmAction("remove this friend")) {
      executeApiCall({
        url: `/admin/userslist/${userId}/friends`,
        method: "DELETE",
        data: { friendId },
        element: $btn,
        successCallback: function () {
          // Анимация удаления строки
          friendRow.fadeOut(300, function () {
            $(this).remove();
            showUserMessage("Friend removed successfully", "success");

            // Если друзей больше нет, показываем сообщение
            if ($(".friend-row").length === 0) {
              $(".friends-table").html(
                '<div class="no-friends">No friends found</div>'
              );
            }
          });
        },
        errorCallback: function (error) {
          showUserMessage("Failed to remove friend", "error");
          console.error("Error removing friend:", error);
        },
      });
    }
  });

  // Save user changes
  $(document).on("click", ".save-changes", function () {
    const $btn = $(this);
    const userId = $btn.data("id");
    const userRow = $btn.closest(".user-row");

    // Collect data from form fields
    const userData = {
      fullname: userRow
        .find("input[type='text'][id='floatingInputValue']")
        .val(),
      email: userRow.find("input[type='email']").val(),
      birthdate: userRow.find("input[type='date']").val(),
      role: userRow.find(".role input").val(),
      status: userRow.find(".status input").val(),
    };

    // Validate data
    if (!userData.fullname || !userData.email) {
      showUserMessage("Name and email are required fields", "error");
      return;
    }

    // Save user data
    executeApiCall({
      url: `/admin/users/${userId}`,
      method: "PUT",
      data: userData,
      element: $btn,
      successCallback: function (response) {
        showUserMessage("User data updated successfully", "success");
      },
      errorCallback: function (error) {
        showUserMessage("Failed to update user data", "error");
        console.error("Error updating user:", error);
      },
    });
  });

  // Handle role change from dropdown
  $(document).on(
    "click",
    ".dropdown-item.role-admin, .dropdown-item.role-user",
    function (e) {
      e.preventDefault(); // Prevent default anchor behavior that scrolls to top
      const role = $(this).data("value") || $(this).text();
      const inputField = $(this)
        .closest(".input-group")
        .find("input.form-control");

      inputField.val(role);
      inputField.attr("class", "form-control role-" + role);
    }
  );

  // Handle status change from dropdown
  $(document).on(
    "click",
    ".dropdown-item.status-active, .dropdown-item.status-unverified, .dropdown-item.status-blocked",
    function (e) {
      e.preventDefault(); // Prevent default anchor behavior that scrolls to top
      const status = $(this).data("value") || $(this).text();
      const inputField = $(this)
        .closest(".input-group")
        .find("input.form-control");

      inputField.val(status);
      inputField.attr("class", "form-control status-" + status);
    }
  );

  /**
   * Shows a message to the user
   * @param {string} message - The message to display
   * @param {string} type - Message type (success, error)
   */
  function showUserMessage(message, type) {
    // Create message element if it doesn't exist
    if ($("#user-message").length === 0) {
      $("body").append(
        '<div id="user-message" class="message-container"></div>'
      );
    }

    const messageClass =
      type === "success" ? "success-message" : "error-message";
    const messageElement = $(
      `<div class="message ${messageClass}">${message}</div>`
    );

    $("#user-message").append(messageElement);

    // Remove message after 3 seconds
    setTimeout(() => {
      messageElement.fadeOut(300, function () {
        $(this).remove();
      });
    }, 3000);
  }

  /**
   * Helper function to navigate to different user sections
   * @param {string} userId - The ID of the user
   * @param {string} section - The section to navigate to (friends, feed, etc.)
   */
  function navigateToUserSection(userId, section) {
    const protocol = window.location.protocol;
    const host = window.location.host;
    window.location.href = `${protocol}//${host}/admin/userslist/${userId}/${section}`;
  }

  /**
   * ====================================================
   * POSTS FEED FUNCTIONALITY
   * ====================================================
   */

  /**
   * Initialize the posts feed page functionality
   */
  function initPostsFeed() {
    // Cache commonly used selectors
    const $postsList = $(".posts-list");
    const $postsContainer = $(".feed-list-container");

    // Store references to avoid repeated DOM lookups
    window.adminCache = {
      $postsList: $postsList,
      $postsContainer: $postsContainer,
      selectors: {},
    };

    // Set up event handlers for post actions
    setupPostActions();

    // Set up comment visibility toggling
    setupCommentToggle();

    // Set up comment deletion
    setupCommentActions();
  }

  // Вспомогательная функция для кэширования селекторов
  function getSelector(selector, context) {
    const cache = window.adminCache.selectors;

    // Создаем ключ кэша на основе селектора и контекста
    const cacheKey = `${selector}_${
      context ? $(context).data("id") || "ctx" : "global"
    }`;

    if (!cache[cacheKey]) {
      cache[cacheKey] = context ? $(selector, context) : $(selector);
    }

    return cache[cacheKey];
  }

  // Вспомогательная функция для эффективного создания и добавления элементов
  function renderElements(container, items, renderer) {
    // Создаем фрагмент документа для всех элементов
    const fragment = document.createDocumentFragment();

    // Добавляем каждый элемент в фрагмент
    items.forEach((item) => {
      const element = renderer(item);
      fragment.appendChild(element instanceof jQuery ? element[0] : element);
    });

    // Очищаем контейнер и добавляем фрагмент за одну операцию
    container.empty().append(fragment);
  }

  /**
   * Set up all post action buttons (delete, restore, block, unblock)
   */
  function setupPostActions() {
    setupDeletePostAction();
    setupRestorePostAction();
    setupBlockPostAction();
    setupUnblockPostAction();
  }

  /**
   * Set up post action handlers
   * Responsible for delete, restore, block and unblock actions
   */
  function setupDeletePostAction() {
    $(document).on("click", ".delete-post-btn", function () {
      const $btn = $(this);
      const postId = $btn.data("post-id");
      const postItem = $btn.closest(".post-item");

      if (confirmAction("delete this post")) {
        performPostAction(postId, "delete", $btn).then(function (result) {
          if (result.success) {
            postItem.addClass("deleted-post");

            // Заменяем содержимое на системное сообщение
            postItem
              .find(".post-content")
              .html(
                '<p class="system-message">This post was deleted by the admin, because it violated the community rules.</p>'
              );

            updatePostStatusVisuals(postItem);
            showUserMessage(result.message || "Post deleted", "success");
          }
        });
      }
    });
  }

  /**
   * Set up restore post action
   */
  function setupRestorePostAction() {
    $(document).on("click", ".restore-post-btn", function () {
      const $btn = $(this);
      const postId = $btn.data("post-id");
      const postItem = $btn.closest(".post-item");
      const originalContent = postItem.data("original-content");

      if (confirmAction("restore this post")) {
        performPostAction(postId, "restore", $btn).then(function (result) {
          if (result.success) {
            postItem.removeClass("deleted-post");

            // Восстанавливаем содержимое поста
            postItem.find(".post-content").html(`<p>${originalContent}</p>`);

            updatePostStatusVisuals(postItem);
            showUserMessage(result.message || "Post restored", "success");
          }
        });
      }
    });
  }

  /**
   * Set up block post action
   */
  function setupBlockPostAction() {
    $(document).on("click", ".block-post-btn", function () {
      const $btn = $(this);
      const postId = $btn.data("post-id");
      const postItem = $btn.closest(".post-item");

      if (confirmAction("block this post")) {
        performPostAction(postId, "block", $btn).then(function (result) {
          if (result.success) {
            postItem.addClass("blocked-post");

            // Если пост не удален, заменяем содержимое на системное сообщение
            if (!postItem.hasClass("deleted-post")) {
              postItem
                .find(".post-content")
                .html(
                  '<p class="system-message">This post was blocked by the admin, because it violated the community rules.</p>'
                );
            }

            updatePostStatusVisuals(postItem);
            showUserMessage(result.message || "Post blocked", "success");
          }
        });
      }
    });
  }

  /**
   * Set up unblock post action
   */
  function setupUnblockPostAction() {
    $(document).on("click", ".unblock-post-btn", function () {
      const $btn = $(this);
      const postId = $btn.data("post-id");
      const postItem = $btn.closest(".post-item");
      const originalContent = postItem.data("original-content");

      if (confirmAction("unblock this post")) {
        performPostAction(postId, "unblock", $btn).then(function (result) {
          if (result.success) {
            postItem.removeClass("blocked-post");

            // Если пост не удален, восстанавливаем оригинальное содержимое
            if (!postItem.hasClass("deleted-post")) {
              postItem.find(".post-content").html(`<p>${originalContent}</p>`);
            }

            updatePostStatusVisuals(postItem);
            showUserMessage(result.message || "Post unblocked", "success");
          }
        });
      }
    });
  }

  /**
   * Set up comment visibility toggle functionality
   */
  function setupCommentToggle() {
    $(document).on("click", ".toggle-comments-btn", function () {
      const button = $(this);
      const postItem = button.closest(".post-item");
      const commentsSection = postItem.find(".comments-section");

      // Toggle active state for button (for color inversion)
      button.toggleClass("active");

      // Toggle visibility with animation
      if (commentsSection.hasClass("hidden")) {
        commentsSection.removeClass("hidden");

        // Use setTimeout to allow the CSS transition to work properly
        setTimeout(function () {
          commentsSection.addClass("visible");
        }, 10);

        button.html('<i class="fas fa-angle-up"></i> Hide commentaries');
      } else {
        commentsSection.removeClass("visible");

        // Use setTimeout to wait for animation to complete before hiding
        setTimeout(function () {
          commentsSection.addClass("hidden");
        }, 400); // match transition duration

        button.html('<i class="fas fa-angle-down"></i> Show commentaries');
      }
    });
  }

  /**
   * Update the comments count and related UI elements
   * @param {jQuery} postItem - Post item element
   * @param {Number} count - New comments count
   */
  function updateCommentsCount(postItem, count) {
    // Update the count text
    const commentsCount = postItem.find(".comments-count");
    commentsCount.text(`Comments (${count})`);

    // Check if this was the last comment
    const commentsSection = postItem.find(".comments-section");
    const remainingComments = commentsSection.find(".comment-item").length;

    // If we have 0 comments and the section is not already hidden
    if (count === 0 && !commentsSection.hasClass("hidden")) {
      // Add no comments message if it doesn't exist
      if (commentsSection.find(".no-comments-message").length === 0) {
        commentsSection.html('<p class="no-comments-message">No comments</p>');
      }
      commentsSection.addClass("visible");
    }

    // Update the toggle button text
    const toggleBtn = postItem.find(".toggle-comments-btn");
    if (toggleBtn.length) {
      toggleBtn.text(count > 0 ? `Show comments (${count})` : "No comments");

      // Hide toggle button if no comments
      if (count === 0) {
        toggleBtn.addClass("disabled");
      } else {
        toggleBtn.removeClass("disabled");
      }
    }
  }

  /**
   * Set up comment deletion
   */
  function setupCommentActions() {
    // Delete comment
    $(document).on("click", ".delete-comment-btn", function () {
      const $btn = $(this);
      const postId = $btn.data("post-id");
      const commentId = $btn.data("comment-id");
      const commentItem = $btn.closest(".comment-item");
      const postItem = $btn.closest(".post-item");
      const commentsCount = postItem.find(".comments-count");

      if (confirmAction("delete this comment")) {
        executeApiCall({
          url: `/admin/posts/${postId}/comments/${commentId}`,
          method: "DELETE",
          element: $btn,
          successCallback: function (data) {
            // Remove comment from DOM
            commentItem.fadeOut(300, function () {
              $(this).remove();

              // Get the current post item
              const postItem = commentsCount.closest(".post-item");

              // Calculate new count
              const count = parseInt(commentsCount.text().match(/\d+/)[0]) - 1;

              // Update UI with new count
              updateCommentsCount(postItem, count);

              // Check if this was the last comment
              const commentsSection = postItem.find(".comments-section");
              const remainingComments =
                commentsSection.find(".comment-item").length;

              if (
                remainingComments === 0 &&
                !commentsSection.hasClass("hidden")
              ) {
                // Add no comments message
                commentsSection.html(
                  '<p class="no-comments-message">No commentaries</p>'
                );
                commentsSection.addClass("visible");
              }

              // Show message
              showUserMessage("Comment deleted successfully", "success");
            });
          },
          errorCallback: function (error) {
            showUserMessage("Failed to delete comment", "error");
            console.error("Error deleting comment:", error);
          },
        });
      }
    });
  }

  /**
   * ====================================================
   * UTILITY FUNCTIONS
   * ====================================================
   */

  /**
   * Display a confirmation dialog for post actions
   * @param {string} actionText - Text describing the action
   * @returns {boolean} - True if confirmed, false otherwise
   */
  function confirmAction(actionText) {
    return confirm(`Are you sure you want to ${actionText}?`);
  }

  /**
   * Perform post action (delete, restore, block, unblock)
   * @param {string} postId - ID of the post
   * @param {string} action - Action to perform (delete, restore, block, unblock)
   * @param {jQuery} element - Button or element that triggered the action
   * @returns {Promise} Promise that resolves with the API response
   */
  function performPostAction(postId, action, element) {
    return new Promise((resolve, reject) => {
      executeApiCall({
        url: `/admin/api/posts/${postId}/${action}`,
        method: "POST",
        element: element,
        successCallback: function (data) {
          resolve(data);
        },
        errorCallback: function (error, errorData) {
          showUserMessage(
            errorData.message || `Failed to ${action} post`,
            "error"
          );
          reject(errorData);
        },
      });
    });
  }

  /**
   * Update post visual elements based on state
   * @param {jQuery} postItem - The post item element
   */
  function updatePostStatusVisuals(postItem) {
    const isDeleted = postItem.hasClass("deleted-post");
    const isBlocked = postItem.hasClass("blocked-post");
    const originalContent = postItem.data("original-content");

    // Get all action buttons
    const $deleteBtn = postItem.find(".delete-post-btn");
    const $restoreBtn = postItem.find(".restore-post-btn");
    const $blockBtn = postItem.find(".block-post-btn");
    const $unblockBtn = postItem.find(".unblock-post-btn");

    // Update status badges
    const $statusContainer = postItem.find(".post-status-badges");
    $statusContainer.empty();

    if (isDeleted) {
      $statusContainer.append(
        '<span class="deleted-status status-badge">DELETED</span>'
      );
      // Если пост удален, заменяем содержимое на системное сообщение
      postItem
        .find(".post-content")
        .html(
          '<p class="system-message">This post was deleted by the admin, because it violated the community rules.</p>'
        );
    } else {
      // Проверяем, было ли восстановление
      if (
        !postItem.find(".post-content p.system-message").length &&
        !postItem.find(".post-content p").text()
      ) {
        postItem.find(".post-content").html(`<p>${originalContent}</p>`);
      }
    }

    if (isBlocked) {
      $statusContainer.append(
        '<span class="blocked-status status-badge">BLOCKED</span>'
      );

      // Если пост заблокирован, но не удален, показываем сообщение о блокировке
      if (!isDeleted) {
        postItem
          .find(".post-content")
          .html(
            '<p class="system-message">This post was blocked by the admin, because it violated the community rules.</p>'
          );
      }
    } else if (!isDeleted) {
      // Если пост не заблокирован и не удален, восстанавливаем оригинальное содержимое
      postItem.find(".post-content").html(`<p>${originalContent}</p>`);
    }

    // Update button states
    $deleteBtn.prop("disabled", isDeleted);
    $restoreBtn.prop("disabled", !isDeleted);
    $blockBtn.prop("disabled", isBlocked || isDeleted);
    $unblockBtn.prop("disabled", !isBlocked || isDeleted);

    // Update comments section
    const $commentsSection = postItem.find(".comments-section");
    const $commentsToggle = postItem.find(".toggle-comments-btn");

    if (isDeleted || isBlocked) {
      if (isDeleted) {
        $commentsToggle.addClass("deleted-btn").removeClass("blocked-btn");
      } else if (isBlocked) {
        $commentsToggle.addClass("blocked-btn").removeClass("deleted-btn");
      }

      // If comments are visible, hide them
      if (!$commentsSection.hasClass("hidden")) {
        $commentsSection.addClass("hidden");
        $commentsToggle.html('<i class="fas fa-angle-down"></i> Show Comments');
      }
    } else {
      $commentsToggle.removeClass("deleted-btn blocked-btn");
    }
  }

  /**
   * Enhanced error handling utility
   * @param {Object|string} error - Error object or message
   * @param {string} context - Context where error occurred
   * @param {boolean} showToUser - Whether to show the error to the user
   */
  function handleError(error, context, showToUser = true) {
    // Determine error type and extract message
    let errorMessage = "An unexpected error occurred";
    let errorDetails = {};

    if (typeof error === "string") {
      errorMessage = error;
    } else if (error.responseJSON) {
      // AJAX error
      errorMessage =
        error.responseJSON.error ||
        `Server error (${error.status || "unknown status"})`;
      errorDetails = {
        status: error.status,
        statusText: error.statusText,
        responseJSON: error.responseJSON,
      };
    } else if (error instanceof Error) {
      // JavaScript error
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        stack: error.stack,
      };
    } else if (error.error) {
      // Custom error object
      errorMessage = error.error;
      errorDetails = error;
    }

    // Log the error with context for debugging
    console.error(`Error in ${context}:`, errorMessage, errorDetails);

    // Show error message to user if needed
    if (showToUser) {
      showUserMessage(errorMessage, "error");
    }

    // Return formatted error for further processing if needed
    return {
      message: errorMessage,
      details: errorDetails,
      context,
    };
  }

  /**
   * Execute API call with loading indicator and error handling
   * @param {Object} options - Options for the API call
   * @param {string} options.url - API endpoint URL
   * @param {string} options.method - HTTP method (GET, POST, etc.)
   * @param {Object} options.data - Data to send (for POST, PUT, etc.)
   * @param {jQuery} options.element - Element to show loading state on
   * @param {boolean} options.showLoadingContainer - Whether to show loading state on container
   * @param {string} options.loadingContainer - Selector for container to show loading state on
   * @param {Function} options.successCallback - Callback on success
   * @param {Function} options.errorCallback - Callback on error
   */
  function executeApiCall(options) {
    // Default options
    const defaults = {
      method: "GET",
      data: {},
      showLoadingContainer: false,
    };

    // Merge defaults with options
    const settings = { ...defaults, ...options };

    // Add loading state to button or element
    if (settings.element) {
      settings.element.addClass("loading");
    }

    // Add loading state to container
    if (settings.showLoadingContainer && settings.loadingContainer) {
      const container = $(settings.loadingContainer);
      container.addClass("loading container-loading");
    }

    $.ajax({
      url: settings.url,
      method: settings.method,
      data: settings.data,
      success: function (data) {
        // Remove loading states
        if (settings.element) {
          settings.element.removeClass("loading");
        }

        if (settings.showLoadingContainer && settings.loadingContainer) {
          $(settings.loadingContainer).removeClass("loading container-loading");
        }

        // Call success callback if provided
        if (typeof settings.successCallback === "function") {
          settings.successCallback(data);
        }
      },
      error: function (xhr, status, error) {
        // Remove loading states
        if (settings.element) {
          settings.element.removeClass("loading");
        }

        if (settings.showLoadingContainer && settings.loadingContainer) {
          $(settings.loadingContainer).removeClass("loading container-loading");
        }

        // Parse error data if available
        let errorData = { message: "An error occurred" };
        try {
          if (xhr.responseJSON) {
            errorData = xhr.responseJSON;
          } else if (xhr.responseText) {
            errorData = JSON.parse(xhr.responseText);
          }
        } catch (e) {
          console.warn("Failed to parse error response:", e);
        }

        // Call error callback if provided
        if (typeof settings.errorCallback === "function") {
          settings.errorCallback(error, errorData, xhr);
        } else {
          // Default error handling
          handleError(error, {
            context: `API call to ${settings.url}`,
            status: xhr.status,
            errorData,
          });
        }
      },
    });
  }

  /**
   * Update post status and UI based on the given configuration
   * @param {jQuery} postItem - The post item element
   * @param {Object} config - Configuration for the update
   */
  function updatePostStatus(postItem, config) {
    // Add class if specified
    if (config.addClass) {
      postItem.addClass(config.addClass);
    }

    // Add badge if specified
    if (config.badge && !postItem.find(`.${config.badge.type}`).length) {
      postItem
        .find(".post-status-badges")
        .append(
          `<span class="${config.badge.type} status-badge">${config.badge.text}</span>`
        );
    }

    // Update content if a system message is provided
    if (config.systemMessage) {
      postItem
        .find(".post-content")
        .html(`<p class="system-message">${config.systemMessage}</p>`);
    }

    // Update comment button styles if specified
    if (config.commentBtnUpdates) {
      const commentBtn = postItem.find(".toggle-comments-btn");

      if (config.commentBtnUpdates.removeClass) {
        commentBtn.removeClass(config.commentBtnUpdates.removeClass);
      }

      if (config.commentBtnUpdates.addClass) {
        commentBtn.addClass(config.commentBtnUpdates.addClass);
      }
    }

    // Enable/disable buttons
    if (config.buttonToEnable) {
      postItem.find(`.${config.buttonToEnable}`).prop("disabled", false);
    }

    if (config.buttonToDisable) {
      postItem.find(`.${config.buttonToDisable}`).prop("disabled", true);
    }

    // Update all button states
    updatePostActionsUI(postItem);
  }

  /**
   * Update the UI state of all action buttons for a post
   * @param {jQuery} postItem - The post item element
   */
  function updatePostActionsUI(postItem) {
    const isDeleted = postItem.hasClass("deleted-post");
    const isBlocked = postItem.hasClass("blocked-post");

    // Delete button is active only if post is not deleted
    postItem.find(".delete-post-btn").prop("disabled", isDeleted);

    // Restore button is active only if post is deleted
    postItem.find(".restore-post-btn").prop("disabled", !isDeleted);

    // Block button is active only if post is not blocked and not deleted
    postItem.find(".block-post-btn").prop("disabled", isBlocked || isDeleted);

    // Unblock button is active only if post is blocked and not deleted
    postItem
      .find(".unblock-post-btn")
      .prop("disabled", !isBlocked || isDeleted);
  }

  // Вызываем функцию при загрузке страницы
  $(document).ready(function () {
    // ... existing code ...
    // ... existing code ...
  });
});
