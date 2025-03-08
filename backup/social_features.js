/**
 * Резервная копия кода функционала социальных функций
 * Здесь сохранены методы для лайков и комментариев
 */

// ===== МЕТОДЫ DATAMANAGER =====

/**
 * Добавить лайк к посту
 */
async function likePost(postId, userId) {
  const newsData = await this.getNewsData();
  const postIndex = newsData.findIndex((post) => post.id === postId);

  if (postIndex === -1) return false;

  const post = newsData[postIndex];
  const alreadyLiked = post.likes.includes(userId);

  if (alreadyLiked) {
    // Убираем лайк
    post.likes = post.likes.filter((id) => id !== userId);
  } else {
    // Добавляем лайк
    post.likes.push(userId);
  }

  const success = await this.writeJSONFile(PATHS.news, newsData);
  if (success) {
    this.cache.news = newsData;
    return {
      liked: !alreadyLiked,
      likesCount: post.likes.length,
    };
  }
  return false;
}

/**
 * Добавить комментарий к посту
 */
async function addComment(postId, userId, content) {
  const newsData = await this.getNewsData();
  const postIndex = newsData.findIndex((post) => post.id === postId);

  if (postIndex === -1) return false;

  const newComment = {
    id: `comment-${Date.now()}`,
    userId,
    content,
    date: new Date().toISOString(),
  };

  newsData[postIndex].comments.push(newComment);

  const success = await this.writeJSONFile(PATHS.news, newsData);
  if (success) {
    this.cache.news = newsData;
    return newComment;
  }
  return false;
}

/**
 * Удалить комментарий
 */
async function deleteComment(postId, commentId) {
  const newsData = await this.getNewsData();
  const postIndex = newsData.findIndex((post) => post.id === postId);

  if (postIndex === -1) return false;

  const commentIndex = newsData[postIndex].comments.findIndex(
    (comment) => comment.id === commentId
  );

  if (commentIndex === -1) return false;

  newsData[postIndex].comments.splice(commentIndex, 1);

  const success = await this.writeJSONFile(PATHS.news, newsData);
  if (success) {
    this.cache.news = newsData;
    return true;
  }
  return false;
}

// ===== МАРШРУТЫ АДМИН ПАНЕЛИ =====

/**
 * Маршрут для лайка поста
 */
// Лайк поста
// adminRouter.post("/posts/:postId/like", async (req, res) => {
//   try {
//     const { postId } = req.params;
//     const { userId } = req.body;

//     const result = await dataManager.likePost(postId, userId);

//     if (result) {
//       res.status(200).json(result);
//     } else {
//       res.status(404).json({ error: "Пост не найден" });
//     }
//   } catch (error) {
//     console.error("Ошибка при добавлении лайка:", error);
//     res.status(500).json({ error: "Ошибка сервера" });
//   }
// });

/**
 * Маршрут для добавления комментария
 */
// Добавление комментария
// adminRouter.post("/posts/:postId/comment", async (req, res) => {
//   try {
//     const { postId } = req.params;
//     const { userId, content } = req.body;

//     if (!content || content.trim() === "") {
//       return res.status(400).json({ error: "Комментарий не может быть пустым" });
//     }

//     const comment = await dataManager.addComment(postId, userId, content);

//     if (comment) {
//       // Получим информацию о пользователе
//       const user = (await dataManager.getUsersByIds([userId]))[0];
//       const commentWithUser = {
//         ...comment,
//         userName: user ? user.fullname : "Неизвестный пользователь",
//         userPhoto: user ? user.photo : null
//       };

//       res.status(201).json(commentWithUser);
//     } else {
//       res.status(404).json({ error: "Пост не найден" });
//     }
//   } catch (error) {
//     console.error("Ошибка при добавлении комментария:", error);
//     res.status(500).json({ error: "Ошибка сервера" });
//   }
// });

/**
 * Маршрут для удаления комментария
 */
// Удаление комментария
// adminRouter.delete("/posts/:postId/comments/:commentId", async (req, res) => {
//   try {
//     const { postId, commentId } = req.params;

//     const success = await dataManager.deleteComment(postId, commentId);

//     if (success) {
//       res.status(200).json({ success: true });
//     } else {
//       res.status(404).json({ error: "Пост или комментарий не найден" });
//     }
//   } catch (error) {
//     console.error("Ошибка при удалении комментария:", error);
//     res.status(500).json({ error: "Ошибка сервера" });
//   }
// });

// ===== КОД КЛИЕНТСКОЙ ЧАСТИ =====

/**
 * Функционал лайков
 */
/*
document.querySelectorAll('.like-button').forEach(button => {
  button.addEventListener('click', function() {
    const postId = this.getAttribute('data-post-id');
    const likeCount = this.querySelector('.like-count');
    const likeIcon = this.querySelector('i');
    
    fetch(`/admin/posts/${postId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: currentUserId })
    })
    .then(response => response.json())
    .then(data => {
      if (data.liked) {
        this.classList.add('liked');
      } else {
        this.classList.remove('liked');
      }
      likeCount.textContent = data.likesCount;
    })
    .catch(error => {
      console.error('Ошибка при лайке:', error);
    });
  });
});
*/

/**
 * Переключение видимости формы комментариев
 */
/*
document.querySelectorAll('.comment-toggle').forEach(toggle => {
  toggle.addEventListener('click', function() {
    const postCard = this.closest('.post-card');
    const commentForm = postCard.querySelector('.comment-form');
    const commentsSection = postCard.querySelector('.comments-section');
    
    commentForm.classList.toggle('hidden');
    if (commentsSection) {
      commentsSection.classList.toggle('hidden');
    }
  });
});
*/

/**
 * Отправка комментария
 */
/*
document.querySelectorAll('.comment-form form').forEach(form => {
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const postId = this.getAttribute('data-post-id');
    const content = this.querySelector('textarea').value;
    const commentsContainer = this.closest('.post-card').querySelector('.comments-container');
    const commentCount = this.closest('.post-card').querySelector('.comment-count');
    
    if (!content.trim()) {
      alert('Комментарий не может быть пустым');
      return;
    }
    
    fetch(`/admin/posts/${postId}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        userId: currentUserId, 
        content: content 
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.id) {
        // Добавляем новый комментарий в DOM
        const newComment = document.createElement('div');
        newComment.className = 'comment';
        newComment.innerHTML = `
          <div class="comment-header">
            <div class="comment-author">${data.userName}</div>
            <div class="comment-date">${new Date(data.date).toLocaleString()}</div>
          </div>
          <div class="comment-text">${data.content}</div>
        `;
        
        // Если секция комментариев скрыта, показываем её
        const commentsSection = this.closest('.post-card').querySelector('.comments-section');
        if (commentsSection && commentsSection.classList.contains('hidden')) {
          commentsSection.classList.remove('hidden');
        }
        
        // Если секции комментариев нет, создаем её
        if (!commentsSection) {
          const newCommentsSection = document.createElement('div');
          newCommentsSection.className = 'comments-section';
          newCommentsSection.appendChild(newComment);
          this.closest('.post-card').querySelector('.comment-form').before(newCommentsSection);
        } else {
          commentsSection.appendChild(newComment);
        }
        
        // Обновляем счетчик комментариев
        const currentCount = parseInt(commentCount.textContent);
        commentCount.textContent = currentCount + 1;
        
        // Очищаем форму
        this.querySelector('textarea').value = '';
      }
    })
    .catch(error => {
      console.error('Ошибка при отправке комментария:', error);
    });
  });
});
*/

// ===== HTML/PUG КОД =====

/*
.comments-action
  button.comment-toggle(data-post-id=post.id)
    i.fas.fa-comment
    span.comment-count #{post.comments.length}

if post.comments && post.comments.length > 0
  .comments-section
    .comments-container
      each comment in post.comments
        .comment
          .comment-header
            .comment-author #{comment.userName || 'Пользователь ID: ' + comment.userId}
            .comment-date #{new Date(comment.date).toLocaleString()}
          .comment-text #{comment.content}

.comment-form.hidden
  form(data-post-id=post.id)
    textarea(name="content", placeholder="Напишите комментарий...", required)
    button(type="submit") Отправить
*/
