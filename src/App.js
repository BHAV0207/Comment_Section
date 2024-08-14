import React, { useState, useEffect } from 'react';
import './App.css';

const CommentSection = () => {
  const [comments, setComments] = useState([]);
  const [name, setName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [editCommentId, setEditCommentId] = useState(null);
  const [warningMessage, setWarningMessage] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [sortBy, setSortBy] = useState('newest'); // New state for sorting

  // Load comments from localStorage
  useEffect(() => {
    try {
      const savedComments = localStorage.getItem('comments');
      console.log('Raw data from localStorage:', savedComments);
      
      if (savedComments === null) {
        console.log('No data found in localStorage');
        return;
      }
      
      if (savedComments === '[]') {
        console.log('Empty array found in localStorage');
        return;
      }
      
      const parsedComments = JSON.parse(savedComments);
      console.log('Parsed comments:', parsedComments);
      
      if (Array.isArray(parsedComments) && parsedComments.length > 0) {
        setComments(parsedComments);
        console.log('Comments loaded successfully');
      } else {
        console.log('Parsed data is not a non-empty array');
      }
    } catch (error) {
      console.error('Error loading comments from localStorage:', error);
      setWarningMessage('Error loading comments. Please try refreshing the page.');
    }
  }, []);

  // Save comments to localStorage
  useEffect(() => {
    try {
      const commentsToSave = JSON.stringify(comments);
      console.log('Saving to localStorage:', commentsToSave);
      localStorage.setItem('comments', commentsToSave);
      console.log('Comments saved successfully');
    } catch (error) {
      console.error('Error saving comments to localStorage:', error);
      setWarningMessage('Error saving comments. Your changes may not persist.');
    }
  }, [comments]);

  const handleAddComment = (parentId = null) => {
    if (name.trim() && commentText.trim()) {
      const newComment = {
        id: Date.now(),
        name,
        text: commentText,
        date: new Date().toISOString(), // Use ISO string for accurate sorting
        replies: [],
      };
      
      setComments(prevComments => {
        let updatedComments;
        if (parentId === null) {
          updatedComments = [...prevComments, newComment];
        } else {
          updatedComments = addReply(prevComments, parentId, newComment);
        }
        console.log('Updated comments:', updatedComments);
        return updatedComments;
      });
      
      setName('');
      setCommentText('');
      setWarningMessage('');
    } else {
      setWarningMessage('Both name and comment are required!');
    }
  };

  const addReply = (comments, parentId, newReply) => {
    return comments.map(comment => {
      if (comment.id === parentId) {
        return { ...comment, replies: [...comment.replies, newReply] };
      } else if (comment.replies.length > 0) {
        return { ...comment, replies: addReply(comment.replies, parentId, newReply) };
      }
      return comment;
    });
  };

  const handleEditComment = (id) => {
    if (commentText.trim()) {
      setComments(prevComments => updateComment(prevComments, id, commentText));
      setEditCommentId(null);
      setCommentText('');
      setWarningMessage('');
    } else {
      setWarningMessage('Comment text cannot be empty!');
    }
  };

  const updateComment = (comments, id, newText) => {
    return comments.map(comment => {
      if (comment.id === id) {
        return { ...comment, text: newText };
      } else if (comment.replies.length > 0) {
        return { ...comment, replies: updateComment(comment.replies, id, newText) };
      }
      return comment;
    });
  };

  const handleDeleteComment = (commentId) => {
    setComments(prevComments => deleteComment(prevComments, commentId));
    setDeleteConfirmation(null);
  };

  const deleteComment = (comments, id) => {
    return comments.filter(comment => {
      if (comment.id === id) {
        return false;
      }
      if (comment.replies.length > 0) {
        comment.replies = deleteComment(comment.replies, id);
      }
      return true;
    });
  };

  // New function to sort comments
  const sortComments = (commentsToSort) => {
    return commentsToSort.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.date) - new Date(a.date);
        case 'oldest':
          return new Date(a.date) - new Date(b.date);
        case 'mostReplies':
          return b.replies.length - a.replies.length;
        default:
          return 0;
      }
    });
  };

  const renderComments = (commentsToRender, depth = 0) => {
    const sortedComments = sortComments([...commentsToRender]);
    return sortedComments.map((comment) => (
      <li key={comment.id} className={`bg-gray-100 p-4 rounded-lg relative shadow-sm mt-4 ${depth > 0 ? 'ml-6' : ''}`}>
        <p className="font-bold text-gray-800">{comment.name} - <span className="font-normal text-gray-600">{new Date(comment.date).toLocaleString()}</span></p>
        {editCommentId === comment.id ? (
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />
        ) : (
          <p className="mt-2 text-gray-700">{comment.text}</p>
        )}
        <div className="mt-4 space-x-2">
          <button 
            onClick={() => {
              setEditCommentId(comment.id);
              setCommentText(comment.text);
            }}
            className="text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
          <button 
            onClick={() => setDeleteConfirmation(comment.id)}
            className="text-blue-600 hover:text-blue-800"
          >
            Delete
          </button>
          <button 
            onClick={() => {
              setEditCommentId(`reply-${comment.id}`);
              setCommentText('');
              setName('');
            }}
            className="text-blue-600 hover:text-blue-800"
          >
            Reply
          </button>
        </div>
        {editCommentId === comment.id && (
          <button
            onClick={() => handleEditComment(comment.id)}
            className="mt-2 bg-blue-600 text-white py-1 px-3 rounded-md hover:bg-blue-700 transition duration-300"
          >
            Update Comment
          </button>
        )}
        {editCommentId === `reply-${comment.id}` && (
          <div className="mt-4 space-y-2">
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Your Reply"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
            <button
              onClick={() => {
                handleAddComment(comment.id);
                setEditCommentId(null);
              }}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300"
            >
              Submit Reply
            </button>
          </div>
        )}
        {comment.replies.length > 0 && (
          <ul className="mt-4 space-y-4">
            {renderComments(comment.replies, depth + 1)}
          </ul>
        )}
      </li>
    ));
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Comments Section</h2>
      <div className="mb-6 space-y-4">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <textarea
          placeholder="Add a comment"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
        <button 
          onClick={() => handleAddComment()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300"
        >
          Add Comment
        </button>
        {warningMessage && <p className="text-red-500 text-sm mt-2">{warningMessage}</p>}
      </div>
      <div className="mb-4">
        <label htmlFor="sort" className="block text-sm font-medium text-gray-700">Sort by:</label>
        <select
          id="sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="mostReplies">Most Replies</option>
        </select>
      </div>
      <ul className="space-y-6">
        {renderComments(comments)}
      </ul>
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <p className="mb-4">Are you sure you want to delete this comment?</p>
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition duration-300"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteComment(deleteConfirmation)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-300"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentSection;