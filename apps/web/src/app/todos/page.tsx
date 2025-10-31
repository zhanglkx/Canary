'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { GET_TODOS } from '@/lib/graphql/queries';
import { CREATE_TODO, UPDATE_TODO, REMOVE_TODO } from '@/lib/graphql/mutations';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TodosPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const { data, loading, refetch } = useQuery(GET_TODOS, {
    skip: !isAuthenticated,
  });

  const [createTodo, { loading: creating }] = useMutation(CREATE_TODO, {
    onCompleted: () => {
      setTitle('');
      setDescription('');
      refetch();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const [updateTodo, { loading: updating }] = useMutation(UPDATE_TODO, {
    onCompleted: () => {
      setEditingTodo(null);
      setTitle('');
      setDescription('');
      refetch();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const [removeTodo] = useMutation(REMOVE_TODO, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      if (editingTodo) {
        await updateTodo({
          variables: {
            id: editingTodo.id,
            title,
            description: description || null,
          },
        });
      } else {
        await createTodo({
          variables: {
            title,
            description: description || null,
          },
        });
      }
    } catch (err) {
      // Error handled by onError callback
    }
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setTitle(todo.title);
    setDescription(todo.description || '');
  };

  const handleCancelEdit = () => {
    setEditingTodo(null);
    setTitle('');
    setDescription('');
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      await updateTodo({
        variables: {
          id: todo.id,
          completed: !todo.completed,
        },
      });
    } catch (err) {
      // Error handled by onError callback
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this todo?')) {
      try {
        await removeTodo({
          variables: { id },
        });
      } catch (err) {
        // Error handled by onError callback
      }
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Todos</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage your tasks and stay organized
          </p>
        </div>

        {/* Create/Edit Form */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingTodo ? 'Edit Todo' : 'Create New Todo'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter todo title"
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter todo description (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" loading={creating || updating}>
                {editingTodo ? 'Update Todo' : 'Create Todo'}
              </Button>
              {editingTodo && (
                <Button type="button" variant="secondary" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Todos List */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Todos</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                Loading todos...
              </div>
            ) : data?.todos?.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                No todos yet. Create your first one above!
              </div>
            ) : (
              data?.todos?.map((todo: Todo) => (
                <div key={todo.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => handleToggleComplete(todo)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`text-sm font-medium ${
                            todo.completed
                              ? 'line-through text-gray-500 dark:text-gray-500'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {todo.title}
                        </h3>
                        {todo.description && (
                          <p
                            className={`mt-1 text-sm ${
                              todo.completed
                                ? 'line-through text-gray-400 dark:text-gray-600'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {todo.description}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                          Created: {new Date(todo.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(todo)}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(todo.id)}
                        className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
