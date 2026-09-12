import { LogOut, Settings, User } from "lucide-react";
import { useState } from "react";
import type { UserDTO } from "@/lib/nexus/auth.server";
import { Button, Field, GlassCard, TextInput, TextArea, Modal } from "@/components/nexus/primitives";

interface UserMenuProps {
  user: UserDTO | null;
  onLogout: () => void;
  onUpdateProfile: (displayName: string, avatar?: string) => void;
}

export function UserMenu({ user, onLogout, onUpdateProfile }: UserMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(user?.displayName ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "");

  if (!user) return null;

  const handleSaveProfile = () => {
    onUpdateProfile(editDisplayName, avatar);
    setShowSettings(false);
  };

  const initials = user.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      {/* Profile Button */}
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-background/50 transition-colors"
        >
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-xs font-bold">
            {avatar ? <img src={avatar} alt="" className="w-full h-full rounded-full" /> : initials}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold leading-none">{user.displayName}</p>
            <p className="text-xs text-muted-foreground">@{user.username}</p>
          </div>
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-50">
            <div className="p-4 border-b border-border">
              <p className="text-sm font-semibold">{user.displayName}</p>
              <p className="text-xs text-muted-foreground">@{user.username}</p>
            </div>

            <button
              onClick={() => {
                setShowSettings(true);
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-primary/10 transition-colors flex items-center gap-2"
            >
              <Settings className="h-4 w-4" /> Settings
            </button>

            <button
              onClick={() => {
                onLogout();
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-red-500/10 text-red-500 transition-colors flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <Modal
        open={showSettings}
        onOpenChange={setShowSettings}
        eyebrow="Account"
        title="Settings"
        description="Manage your NEXUS profile"
      >
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold mb-2">Username</p>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          </div>

          <div>
            <p className="text-xs font-semibold mb-2">Email</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>

          <Field label="Display Name" htmlFor="displayName">
            <TextInput
              id="displayName"
              value={editDisplayName}
              onChange={(e) => setEditDisplayName(e.target.value)}
            />
          </Field>

          <Field label="Avatar URL (optional)" htmlFor="avatar">
            <TextInput
              id="avatar"
              placeholder="https://example.com/avatar.jpg"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
            />
          </Field>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
