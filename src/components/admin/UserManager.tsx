"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { KeyRound, Pencil, Plus, Search, ShieldCheck, UserRound, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import type { AdminUser, ManagedUserRole } from "@/types";

interface UserManagerProps {
  currentUserId: number;
}

interface UserForm {
  name: string;
  email: string;
  role: ManagedUserRole;
  password: string;
  passwordConfirmation: string;
}

const emptyForm: UserForm = {
  name: "",
  email: "",
  role: "stock",
  password: "",
  passwordConfirmation: "",
};

const roleLabel: Record<ManagedUserRole, string> = {
  admin: "Administrador",
  stock: "Encargado de stock",
};

function getErrorMessage(status: number, payload: { error?: string; code?: string }) {
  if (status === 401) return "Tu sesión ya no tiene permisos de administrador.";
  if (status === 404) return "El usuario ya no existe.";
  if (payload.code === "SELF_ACCESS_REMOVAL") {
    return "No podés quitarle el acceso de administrador a tu propia cuenta.";
  }
  if (payload.code === "LAST_ADMIN") {
    return "No podés desactivar ni cambiar el rol del último administrador activo.";
  }
  if (payload.code === "EMAIL_EXISTS" || status === 409) {
    return "Ya existe un usuario con ese email.";
  }
  if (status === 400) return "Revisá los datos ingresados.";
  return "No se pudo completar la operación. Intentá nuevamente.";
}

export default function UserManager({ currentUserId }: UserManagerProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [userForm, setUserForm] = useState<UserForm>(emptyForm);
  const [passwordUser, setPasswordUser] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [toggleTarget, setToggleTarget] = useState<{
    user: AdminUser;
    active: boolean;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [pageError, setPageError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setPageError(getErrorMessage(response.status, payload));
        return;
      }
      setUsers(await response.json());
    } catch {
      setPageError("No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("es");
    if (!term) return users;

    return users.filter((user) =>
      `${user.name} ${user.email} ${roleLabel[user.role]}`
        .toLocaleLowerCase("es")
        .includes(term)
    );
  }, [query, users]);

  function openCreateDialog() {
    setEditingUser(null);
    setUserForm(emptyForm);
    setFormError("");
    setUserDialogOpen(true);
  }

  function openEditDialog(user: AdminUser) {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
      passwordConfirmation: "",
    });
    setFormError("");
    setUserDialogOpen(true);
  }

  async function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (!editingUser && userForm.password !== userForm.passwordConfirmation) {
      setFormError("Las contraseñas no coinciden.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        editingUser ? `/api/admin/users/${editingUser.id}` : "/api/admin/users",
        {
          method: editingUser ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: userForm.name,
            email: userForm.email,
            role: userForm.role,
            ...(!editingUser ? { password: userForm.password } : {}),
          }),
        }
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFormError(getErrorMessage(response.status, payload));
        return;
      }

      setUserDialogOpen(false);
      setSuccessMessage(editingUser ? "Usuario actualizado." : "Usuario creado correctamente.");
      await loadUsers();
    } catch {
      setFormError("No se pudo conectar con el servidor. Intentá nuevamente.");
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordUser) return;

    setFormError("");
    setSuccessMessage("");
    if (newPassword !== passwordConfirmation) {
      setFormError("Las contraseñas no coinciden.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${passwordUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFormError(getErrorMessage(response.status, payload));
        return;
      }

      setPasswordUser(null);
      setNewPassword("");
      setPasswordConfirmation("");
      setSuccessMessage(`Contraseña de ${passwordUser.name} actualizada.`);
    } catch {
      setFormError("No se pudo conectar con el servidor. Intentá nuevamente.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmToggle() {
    if (!toggleTarget) return;

    setSaving(true);
    setPageError("");
    setSuccessMessage("");
    try {
      const response = await fetch(`/api/admin/users/${toggleTarget.user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: toggleTarget.active }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setPageError(getErrorMessage(response.status, payload));
        setToggleTarget(null);
        return;
      }

      setSuccessMessage(
        toggleTarget.active ? "Usuario activado." : "Usuario desactivado."
      );
      setToggleTarget(null);
      await loadUsers();
    } catch {
      setPageError("No se pudo conectar con el servidor. Intentá nuevamente.");
      setToggleTarget(null);
    } finally {
      setSaving(false);
    }
  }

  function openPasswordDialog(user: AdminUser) {
    setPasswordUser(user);
    setNewPassword("");
    setPasswordConfirmation("");
    setFormError("");
  }

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Administración
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Usuarios</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Creá accesos para administradores y encargados de stock. Las contraseñas
            nunca vuelven a mostrarse después de guardarlas.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </Button>
      </div>

      <div className="mt-8 flex items-center gap-3 rounded-xl border bg-white px-4">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre, email o rol"
          className="border-0 px-0 shadow-none focus-visible:ring-0"
        />
      </div>

      {successMessage && (
        <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          {successMessage}
        </p>
      )}
      {pageError && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {pageError}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {loading ? (
          Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))
        ) : filteredUsers.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-white p-10 text-center">
            <Users className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-semibold">
              {query ? "No encontramos usuarios" : "Todavía no hay usuarios"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {query
                ? "Probá con otro nombre, email o rol."
                : "Creá el primer acceso para comenzar."}
            </p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <article
              key={user.id}
              className={`rounded-xl border bg-white p-4 shadow-sm sm:p-5 ${
                user.active ? "" : "opacity-70"
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-primary">
                    {user.role === "admin" ? (
                      <ShieldCheck className="h-5 w-5" />
                    ) : (
                      <UserRound className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate font-bold">{user.name}</h2>
                      {user.id === currentUserId && (
                        <Badge variant="outline">Tu cuenta</Badge>
                      )}
                      {!user.active && <Badge variant="secondary">Inactivo</Badge>}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-primary">
                      {roleLabel[user.role]}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t pt-3 sm:border-0 sm:pt-0">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openPasswordDialog(user)}>
                    <KeyRound className="h-4 w-4" />
                    Contraseña
                  </Button>
                  <div className="ml-auto flex items-center gap-2 sm:ml-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {user.active ? "Activo" : "Inactivo"}
                    </span>
                    <Switch
                      checked={user.active}
                      onCheckedChange={(active) => setToggleTarget({ user, active })}
                      disabled={user.id === currentUserId}
                      aria-label={`${user.active ? "Desactivar" : "Activar"} a ${user.name}`}
                    />
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Actualizá los datos y permisos de acceso."
                : "La persona usará estas credenciales para ingresar al sistema."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Nombre</Label>
              <Input
                id="user-name"
                value={userForm.name}
                onChange={(event) => setUserForm({ ...userForm, name: event.target.value })}
                minLength={2}
                maxLength={100}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={userForm.email}
                onChange={(event) => setUserForm({ ...userForm, email: event.target.value })}
                maxLength={150}
                autoComplete="off"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-role">Rol</Label>
              <select
                id="user-role"
                value={userForm.role}
                onChange={(event) =>
                  setUserForm({
                    ...userForm,
                    role: event.target.value as ManagedUserRole,
                  })
                }
                disabled={editingUser?.id === currentUserId}
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="stock">Encargado de stock</option>
                <option value="admin">Administrador</option>
              </select>
              {editingUser?.id === currentUserId && (
                <p className="text-xs text-muted-foreground">
                  Otro administrador debe cambiar el rol de tu cuenta.
                </p>
              )}
            </div>
            {!editingUser && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="user-password">Contraseña inicial</Label>
                  <Input
                    id="user-password"
                    type="password"
                    value={userForm.password}
                    onChange={(event) =>
                      setUserForm({ ...userForm, password: event.target.value })
                    }
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Entre 8 y 72 caracteres, con al menos una letra y un número.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-password-confirmation">Repetir contraseña</Label>
                  <Input
                    id="user-password-confirmation"
                    type="password"
                    value={userForm.passwordConfirmation}
                    onChange={(event) =>
                      setUserForm({
                        ...userForm,
                        passwordConfirmation: event.target.value,
                      })
                    }
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </>
            )}
            {formError && <p className="text-sm font-medium text-red-700">{formError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUserDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : editingUser ? "Guardar cambios" : "Crear usuario"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(passwordUser)} onOpenChange={(open) => !open && setPasswordUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restablecer contraseña</DialogTitle>
            <DialogDescription>
              Definí una nueva contraseña para {passwordUser?.name}. Tendrás que comunicársela
              de forma privada.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={resetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                required
              />
              <p className="text-xs text-muted-foreground">
                Entre 8 y 72 caracteres, con al menos una letra y un número.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password-confirmation">Repetir contraseña</Label>
              <Input
                id="new-password-confirmation"
                type="password"
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                required
              />
            </div>
            {formError && <p className="text-sm font-medium text-red-700">{formError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPasswordUser(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Cambiar contraseña"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(toggleTarget)} onOpenChange={(open) => !open && setToggleTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {toggleTarget?.active ? "Activar usuario" : "Desactivar usuario"}
            </DialogTitle>
            <DialogDescription>
              {toggleTarget?.active
                ? `${toggleTarget.user.name} podrá volver a ingresar al sistema.`
                : `${toggleTarget?.user.name} perderá el acceso al sistema inmediatamente.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setToggleTarget(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant={toggleTarget?.active ? "default" : "destructive"}
              onClick={confirmToggle}
              disabled={saving}
            >
              {saving
                ? "Guardando..."
                : toggleTarget?.active
                  ? "Activar"
                  : "Desactivar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
