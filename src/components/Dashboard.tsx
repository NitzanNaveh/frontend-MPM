import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { projectsAPI } from '../services/api';
import { Project } from '../types';

// ✅ Add type definition for window.confetti
declare global {
  interface Window {
    confetti?: (options: any) => void;
  }
}

const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [confettiLoaded, setConfettiLoaded] = useState(false); // ✅ Confetti state
  const { logout } = useAuth();
  const navigate = useNavigate();

  // ✅ Load confetti script dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src =
      'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';
    script.async = true;
    script.onload = () => setConfettiLoaded(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectsAPI.getAll();
      setProjects(data);
    } catch (err) {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title.trim()) return;

    try {
      setCreating(true);
      await projectsAPI.create(newProject);
      setNewProject({ title: '', description: '' });
      setShowCreateForm(false);
      fetchProjects();

      // ✅ Trigger confetti effect
      if (confettiLoaded && window.confetti) {
        window.confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    } catch (err: any) {
      console.error('Project creation error details:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to create project';
      setError(`Project creation failed: ${errorMessage}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      await projectsAPI.delete(projectId);
      fetchProjects();
    } catch (err) {
      setError('Failed to delete project');
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
            <button onClick={handleLogout} className="btn btn-danger">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem'
          }}
        >
          <h2 style={{ flex: 1, textAlign: 'center' }}>My Projects</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn btn-primary"
          >
            {showCreateForm ? 'Cancel' : 'Create Project'}
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {showCreateForm && (
          <div className="card">
            <h3>Create New Project</h3>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={newProject.title}
                  onChange={(e) =>
                    setNewProject({ ...newProject, title: e.target.value })
                  }
                  style={{ maxWidth: '98%' }}
                  placeholder="Project Title"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <textarea
                  className="form-input"
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject({ ...newProject, description: e.target.value })
                  }
                  style={{ maxWidth: '98%' }}
                  placeholder="Project Description"
                  rows={3}
                />
              </div>
              <div style={{ textAlign: 'right' }}>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="card">
            <h3 style={{ textAlign: 'center' }}>
              No projects yet.
              <br />
              Create your first project!
            </h3>
          </div>
        ) : (
          <div>
            {projects.map((project) => (
              <div key={project.id} className="card">
                <div className="card-header">
                  <div>
                    <h3 className="card-title">{project.title}</h3>
                    {project.description && <p>{project.description}</p>}
                    <small>
                      Tasks: {project.taskCount} | Created:{' '}
                      {new Date(project.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => navigate(`/project/${project.id}`)}
                      className="btn btn-primary"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="btn btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
