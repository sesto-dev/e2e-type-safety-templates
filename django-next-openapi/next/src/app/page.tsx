// next/src/app/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { apiTodosDestroy, apiTodosList, apiTodosCreate, apiTodosPartialUpdate, type Todo } from "~/client";

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_BASEURL ?? "";

  async function loadTodos() {
    setLoading(true);
    try {
      const res = await apiTodosList()
  
      if (res.error || !res.data?.results) throw new Error("Failed to load todos");
      setTodos(res?.data?.results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTodos();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const res = await apiTodosCreate({
        body: { title: title.trim(), description: description.trim() },
      })
   
      if (res.error) {
        throw new Error("Failed to create todo");
      }
      setTitle("");
      setDescription("");
      await loadTodos();
    } catch (err) {
      console.error(err);
      alert((err as Error).message || "Create failed");
    }
  }

  async function toggleComplete(todo: Todo) {
    try {
      const res = await apiTodosPartialUpdate({
        path: { id: todo.id },
        body: {
          is_complete: true
        }
      })
      
      if (res.error) throw new Error("Failed to update");
      await loadTodos();
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  }

  async function handleDelete(todo: Todo) {
    if (!confirm("Delete this todo?")) return;
    try {
      const res = await apiTodosDestroy({
        path: { id: todo.id },
      })
    
      if (res.error) throw new Error("Failed to delete");
      await loadTodos();
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-4">Todos</h1>

      <form onSubmit={handleCreate} className="mb-4 space-y-2">
        <Input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Button type="submit">Add Todo</Button>
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : todos.length === 0 ? (
        <p>No todos yet.</p>
      ) : (
        <ul className="space-y-2">
          {todos.map((t) => (
            <li
              key={t.id}
              className="border rounded p-3 flex items-start justify-between"
            >
              <div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={t.is_complete}
                    onChange={() => toggleComplete(t)}
                  />
                  <strong className={t.is_complete ? "line-through" : ""}>
                    {t.title}
                  </strong>
                </div>
                {t.description && <div className="text-sm text-muted-foreground mt-1">{t.description}</div>}
                <div className="text-xs text-muted-foreground mt-2">
                  Created {new Date(t.created_at).toLocaleString()}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <Button variant="ghost" onClick={() => toggleComplete(t)}>
                  {t.is_complete ? "Mark open" : "Complete"}
                </Button>
                <Button variant="destructive" onClick={() => handleDelete(t)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
