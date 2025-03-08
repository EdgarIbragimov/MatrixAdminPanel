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
    const userId = $(this).closest(".friend-row").data("user-id");
    const friendId = $(this).data("friend-id");

    executeApiCall({
      url: `/admin/userslist/${userId}/friends`,
      method: "DELETE",
      data: { friendId },
      successCallback: function () {
        location.reload();
      },
    });
  });

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
    // Set up event handlers for post actions
    setupPostActions();

    // Set up comment visibility toggling
    setupCommentToggle();
  }

  /**
   * Set up all post action buttons (delete, restore, block, unblock)
   */
  function setupPostActions() {
    // Mark post as deleted
    $(document).on("click", ".delete-post-btn", function () {
      const postId = $(this).data("post-id");
      const postItem = $(this).closest(".post-item");

      if (confirmAction("mark this post as deleted")) {
        performPostAction({
          postId,
          action: "markDeleted",
          successCallback: function (data) {
            updatePostStatus(postItem, {
              addClass: "deleted-post",
              badge: {
                type: "deleted-status",
                text: "DELETED",
              },
              systemMessage:
                "This post was deleted by the admin, because it violated the community rules.",
              buttonToEnable: "restore-post-btn",
              buttonToDisable: "delete-post-btn",
              commentBtnUpdates: {
                removeClass: "blocked-btn",
                addClass: "deleted-btn",
              },
            });
          },
        });
      }
    });

    // Restore deleted post
    $(document).on("click", ".restore-post-btn", function () {
      const postId = $(this).data("post-id");
      const postItem = $(this).closest(".post-item");
      const originalContent = postItem.data("original-content");

      if (confirmAction("restore this post")) {
        performPostAction({
          postId,
          action: "restore",
          successCallback: function (data) {
            // Remove deleted status
            postItem.removeClass("deleted-post");
            postItem.find(".deleted-status").remove();

            // Restore original content
            postItem.find(".post-content").html(`<p>${originalContent}</p>`);

            // Update comment toggle button style
            const commentToggle = postItem.find(".toggle-comments-btn");
            commentToggle.removeClass("deleted-btn");

            // If post is still blocked, apply blocked styles
            if (postItem.hasClass("blocked-post")) {
              commentToggle.addClass("blocked-btn");
            }

            // Update button states
            postItem.find(".delete-post-btn").prop("disabled", false);
            postItem.find(".restore-post-btn").prop("disabled", true);

            // Update all button states
            updatePostActionsUI(postItem);
          },
        });
      }
    });

    // Block post
    $(document).on("click", ".block-post-btn", function () {
      const postId = $(this).data("post-id");
      const postItem = $(this).closest(".post-item");

      if (confirmAction("block this post")) {
        performPostAction({
          postId,
          action: "block",
          successCallback: function (data) {
            // Skip content update if post is already deleted
            const isAlreadyDeleted = postItem.hasClass("deleted-post");

            updatePostStatus(postItem, {
              addClass: "blocked-post",
              badge: {
                type: "blocked-status",
                text: "BLOCKED",
              },
              systemMessage: isAlreadyDeleted
                ? null
                : "This post was blocked by the admin, because it violated the community rules.",
              buttonToEnable: "unblock-post-btn",
              buttonToDisable: "block-post-btn",
              commentBtnUpdates: isAlreadyDeleted
                ? null
                : {
                    addClass: "blocked-btn",
                  },
            });
          },
        });
      }
    });

    // Unblock post
    $(document).on("click", ".unblock-post-btn", function () {
      const postId = $(this).data("post-id");
      const postItem = $(this).closest(".post-item");
      const originalContent = postItem.data("original-content");

      if (confirmAction("unblock this post")) {
        performPostAction({
          postId,
          action: "unblock",
          successCallback: function (data) {
            // Remove blocked status
            postItem.removeClass("blocked-post");
            postItem.find(".blocked-status").remove();

            // Only restore content if post is not deleted
            if (!postItem.hasClass("deleted-post")) {
              postItem.find(".post-content").html(`<p>${originalContent}</p>`);

              // Update comment toggle button style
              postItem.find(".toggle-comments-btn").removeClass("blocked-btn");
            }

            // Update button states
            postItem.find(".block-post-btn").prop("disabled", false);
            postItem.find(".unblock-post-btn").prop("disabled", true);

            // Update all button states
            updatePostActionsUI(postItem);
          },
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

        button.html('<i class="fas fa-angle-up"></i> Hide Comments');
      } else {
        commentsSection.removeClass("visible");

        // Use setTimeout to wait for animation to complete before hiding
        setTimeout(function () {
          commentsSection.addClass("hidden");
        }, 400); // match transition duration

        button.html('<i class="fas fa-angle-down"></i> Show Comments');
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
   * Perform a post action via API
   * @param {Object} options - Configuration options
   * @param {string} options.postId - The ID of the post
   * @param {string} options.action - The action to perform (markDeleted, restore, block, unblock)
   * @param {Function} options.successCallback - Callback function on success
   */
  function performPostAction(options) {
    executeApiCall({
      url: `/admin/posts/${options.postId}/${options.action}`,
      method: "PUT",
      successCallback: options.successCallback,
      errorCallback: function (error) {
        console.error(`Error ${options.action} post:`, error);
      },
    });
  }

  /**
   * Generic function to make an API call
   * @param {Object} options - Configuration options
   * @param {string} options.url - The API endpoint URL
   * @param {string} options.method - The HTTP method (GET, POST, PUT, DELETE)
   * @param {Object} options.data - Optional data to send
   * @param {Function} options.successCallback - Callback function on success
   * @param {Function} options.errorCallback - Callback function on error
   */
  function executeApiCall(options) {
    const apiOptions = {
      url: options.url,
      method: options.method,
      contentType: "application/json",
      success: options.successCallback || function () {},
      error:
        options.errorCallback ||
        function (error) {
          console.error("API call error:", error);
        },
    };

    // Add data if provided
    if (options.data) {
      apiOptions.data = JSON.stringify(options.data);
    }

    $.ajax(apiOptions);
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
});
