import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { projectsAPI, tasksAPI } from '../services/api';
import { Project, Task } from '../types';

declare global {
  interface Window {
    confetti?: (options: any) => void;
  }
}

const ProjectDetails: React.FC = () => {
  const params = useParams();
  const projectId = params.id; // Make sure we're using the correct parameter name
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', dueDate: '' });
  const [creating, setCreating] = useState(false);
  const [editTaskId, setEditTaskId] = useState<number | null>(null);
  const [editedTask, setEditedTask] = useState<{ title: string; dueDate: string }>({
  title: '',
  dueDate: ''
  });

  const [confettiLoaded, setConfettiLoaded] = useState(false);
  
  // Filter states
  const [completionFilter, setCompletionFilter] = useState<'all' | 'completed' | 'uncompleted'>('all');
  const [dueDateFilter, setDueDateFilter] = useState<'all' | 'no-due-date' | 'today' | 'overdue' | 'future'>('all');
  
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const script = document.createElement('script');
    script.src =
      'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';
    script.async = true;
    script.onload = () => setConfettiLoaded(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    // Fallback: extract from URL if params.id is undefined
    let idToUse = projectId;
    if (!idToUse) {
      const urlParts = window.location.pathname.split('/');
      const urlId = urlParts[urlParts.length - 1];
      idToUse = urlId;
    }
    
    if (idToUse) {
      const id = parseInt(idToUse);
      if (isNaN(id)) {
        setError('Invalid project ID');
        setLoading(false);
        return;
      }
      fetchProjectAndTasks(id);
    } else {
      setError('No project ID provided');
      setLoading(false);
    }
  }, [projectId, params]);

  // Apply filters when tasks or filter states change
  useEffect(() => {
    let filtered = [...tasks];

    // Apply completion filter
    if (completionFilter === 'completed') {
      filtered = filtered.filter(task => task.isCompleted);
    } else if (completionFilter === 'uncompleted') {
      filtered = filtered.filter(task => !task.isCompleted);
    }

    // Apply due date filter
    if (dueDateFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filtered = filtered.filter(task => {
        if (!task.dueDate) {
          return dueDateFilter === 'no-due-date';
        }

        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        switch (dueDateFilter) {
          case 'no-due-date':
            return false; // Already handled above
          case 'today':
            return dueDate.getTime() === today.getTime();
          case 'overdue':
            return dueDate < today && !task.isCompleted;
          case 'future':
            return dueDate > today;
          default:
            return true;
        }
      });
    }

    setFilteredTasks(filtered);
  }, [tasks, completionFilter, dueDateFilter]);

  const fetchProjectAndTasks = async (id: number) => {
    try {
      setLoading(true);
      setError('');
      
      // Add a timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const fetchPromise = Promise.all([
        projectsAPI.getById(id),
        tasksAPI.getByProject(id)
      ]);
      
      const [projectData, tasksData] = await Promise.race([fetchPromise, timeoutPromise]) as [any, any];
      
      if (!projectData) {
        throw new Error('Project data is null or undefined');
      }
      
      setProject(projectData);
      setTasks(tasksData || []);
    } catch (err: any) {
      console.error('Failed to load project details:', err);
      
      let errorMessage = 'Failed to load project details';
      
      if (err.message === 'Request timeout') {
        errorMessage = 'Request timed out. Please try again.';
      } else if (err.message === 'Backend is not accessible') {
        errorMessage = 'Cannot connect to server. Please check if the backend is running on port 5000.';
      } else if (err.response?.status === 404) {
        errorMessage = `Project with ID ${id} not found. It may have been deleted.`;
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (err.response?.status === 0) {
        errorMessage = 'Cannot connect to server. Please check if the backend is running.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      setCreating(true);
      setError('');
      const currentProjectId = project?.id || parseInt(params.id || '0');
      await tasksAPI.create({
        title: newTask.title,
        dueDate: newTask.dueDate || undefined,
        projectId: currentProjectId
      });
      setNewTask({ title: '', dueDate: '' });
      setShowCreateForm(false);
      fetchProjectAndTasks(currentProjectId);
      if (confettiLoaded && window.confetti) {
        window.confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create task';
      setError(`Task creation failed: ${errorMessage}`);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleTask = async (taskId: number, isCompleted: boolean) => {
    try {
      setError('');
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
  
      await tasksAPI.update(taskId, {
        title: task.title,
        dueDate: task.dueDate,
        isCompleted: !isCompleted 
      });
  
      const currentProjectId = project?.id || parseInt(params.id || '0');
      fetchProjectAndTasks(currentProjectId);
      if (!isCompleted && confettiLoaded && window.confetti) {
        window.confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to create task';
          setError(`Task creation failed: ${errorMessage}`);
        } finally {
          setCreating(false);
        }
      };
  

  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      setError('');
      await tasksAPI.delete(taskId);
      const currentProjectId = project?.id || parseInt(params.id || '0');
      fetchProjectAndTasks(currentProjectId);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete task';
      setError(`Task deletion failed: ${errorMessage}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="app">
        <div className="container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="app">
        <nav className="nav">
          <div className="nav-container">
            <h1 className="nav-brand" >Mini Project Manager</h1>
            <div className="nav-links">
              <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
                Back to Dashboard
              </button>
              <button onClick={handleLogout} className="btn btn-danger">
                Logout
              </button>
            </div>
          </div>
        </nav>
        <div className="container">
          <div className="alert alert-error">
            {error || 'Project not found'}
            <div style={{ marginTop: '1rem' }}>
              <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleUpdateTask = async (taskId: number) => {
    try {
      setError('');
      const originalTask = tasks.find(t => t.id === taskId);
      if (!originalTask) return;
  
      await tasksAPI.update(taskId, {
        title: editedTask.title,
        dueDate: editedTask.dueDate || undefined,
        isCompleted: originalTask.isCompleted 
      });
  
      setEditTaskId(null);
      fetchProjectAndTasks(project?.id || parseInt(params.id || '0'));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update task';
      setError(`Task update failed: ${errorMessage}`);
    }
  };
  

  return (
    <div className="app">
      <nav className="nav">
        <div className="nav-container">
        <div
            className="nav-container"
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            <h1 className="nav-brand">Mini Project Manager</h1>
          </div>
          <div className="nav-links">
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
              Back to Dashboard
            </button>
            <button onClick={handleLogout} className="btn btn-danger">
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Centered project title at the top */}
      <div style={{ width: '100%', textAlign: 'center', margin: '2rem 0 1rem 0' }}>
        <h2 className="card-title" style={{ marginBottom: '0.5rem' }}>{project.title}</h2>
        {project.description && <p style={{ margin: 0 }}>{project.description}</p>}
        <small style={{ display: 'block', marginTop: '0.5rem' }}>Created: {new Date(project.createdAt).toLocaleDateString()}</small>
      </div>

      <div className="container">
        {/* Remove title from inside the card */}
        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3>Tasks ({filteredTasks.length})</h3>
            <button 
              onClick={() => setShowCreateForm(!showCreateForm)} 
              className="btn btn-primary"
            >
              {showCreateForm ? 'Cancel' : 'Add Task'}
            </button>
          </div>

          {/* Task Filters */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h4 style={{ marginBottom: '1rem' }}>Filter Tasks</h4>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <label className="form-label">Completion Status:</label>
                <select
                  className="form-input"
                  value={completionFilter}
                  onChange={(e) => setCompletionFilter(e.target.value as 'all' | 'completed' | 'uncompleted')}
                  style={{ width: 'auto', minWidth: '150px' }}
                >
                  <option value="all">All Tasks</option>
                  <option value="completed">Completed</option>
                  <option value="uncompleted">Uncompleted</option>
                </select>
              </div>
              <div>
                <label className="form-label">Due Date:</label>
                <select
                  className="form-input"
                  value={dueDateFilter}
                  onChange={(e) => setDueDateFilter(e.target.value as 'all' | 'no-due-date' | 'today' | 'overdue' | 'future')}
                  style={{ width: 'auto', minWidth: '150px' }}
                >
                  <option value="all">All Dates</option>
                  <option value="no-due-date">No Due Date</option>
                  <option value="today">Due Today</option>
                  <option value="overdue">Overdue</option>
                  <option value="future">Due in Future</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'end' }}>
                <button
                  onClick={() => {
                    setCompletionFilter('all');
                    setDueDateFilter('all');
                  }}
                  className="btn btn-primary"
                  style={{ padding: '0.75rem 1rem' }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {showCreateForm && (
            <div className="card">
              <h4>Add New Task</h4>
              <form onSubmit={handleCreateTask}>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Task title"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date (optional)</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Task'}
                </button>
              </form>
            </div>
          )}

          {filteredTasks.length === 0 ? (
            <div className="card">
              <p>
                {tasks.length === 0 
                  ? "No tasks yet. Add your first task!" 
                  : "No tasks match the current filters. Try adjusting your filter criteria."
                }
              </p>
            </div>
          ) : (
            <div>
              {filteredTasks.map((task) => (
                <div key={task.id} className="task-item">

                  <div className="task-content">
                    {editTaskId === task.id ? (
                      <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleUpdateTask(task.id);
                      }}
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        marginBottom: '1rem',
                        alignItems: 'center'
                      }}
                    >
                      <input
                        type="text"
                        value={editedTask.title}
                        onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                        className="form-input"
                        required
                        style={{ flex: '1 1 200px', minWidth: '150px' }}
                      />
                      <input
                        type="date"
                        value={editedTask.dueDate}
                        onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
                        className="form-input"
                        style={{ flex: '1 1 150px', minWidth: '120px' }}
                      />
                      <button type="submit" className="btn btn-primary" style={{ flex: '1 1 100px' }}>Save</button>
                      <button type="button" className="btn btn-secondary" onClick={() => setEditTaskId(null)} style={{ flex: '1 1 100px' }}>Cancel</button>
                    </form>
                    
                    ) : (
                      <>
                        <h4 className={`task-title ${task.isCompleted ? 'task-completed' : ''}`}>
                          {task.title}
                        </h4>
                        {task.dueDate && (
                          <div className="task-due-date">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </>
                    )} 
                  </div>

                  {/* Only show action buttons if not editing this task */}
                  {editTaskId !== task.id && (
                    <div className="task-actions flex space-x-2 mt-2">
                      <button
                        onClick={() => {
                          setEditTaskId(task.id);
                          setEditedTask({ title: task.title, dueDate: task.dueDate?.slice(0, 10) || '' });
                        }}
                        className="btn btn-outline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleTask(task.id, task.isCompleted)}
                        className={`btn ${task.isCompleted ? 'btn-secondary' : 'btn-success'}`}
                      >
                        {task.isCompleted ? 'Mark as Undone' : 'Mark as Done'}
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="btn btn-danger"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails; 