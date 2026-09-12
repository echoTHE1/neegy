import { Globe, ExternalLink, Copy, Edit, Pin, Trash2, Plus } from "lucide-react";
import { useState, useCallback, useMemo } from "react";
import type { LinkDTO } from "@/lib/nexus/links.server";
import { Button, GlassCard } from "@/components/nexus/primitives";
import { cn } from "@/lib/utils";

interface LinkCardProps {
  link: LinkDTO;
  isOwner: boolean;
  onEdit?: (link: LinkDTO) => void;
  onDelete?: (linkId: string) => void;
  onPin?: (linkId: string, pinned: boolean) => void;
}

export function LinkCard({ link, isOwner, onEdit, onDelete, onPin }: LinkCardProps) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const faviconUrl = useMemo(() => {
    try {
      const url = new URL(link.url);
      return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
    } catch {
      return null;
    }
  }, [link.url]);

  const handleCopyUrl = useCallback(() => {
    void navigator.clipboard.writeText(link.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [link.url]);

  const handleOpenUrl = useCallback(() => {
    window.open(link.url, "_blank", "noopener,noreferrer");
  }, [link.url]);

  return (
    <div className="animate-slide-up">
      <GlassCard
        onClick={handleOpenUrl}
        className={cn(
          "p-5 cursor-pointer transition-all duration-300",
          "hover:shadow-[0_0_20px_rgba(0,255,255,0.2)]",
          "hover:translate-y-[-2px]",
          "group"
        )}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            {faviconUrl ? (
              <img
                src={faviconUrl}
                alt=""
                className="h-8 w-8 rounded"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : null}
            {!faviconUrl && <Globe className="h-8 w-8 text-primary" />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                  {link.title}
                </h3>
                {link.category && (
                  <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider">
                    {link.category}
                  </p>
                )}
              </div>
              {link.pinned && <Pin className="h-4 w-4 text-primary flex-shrink-0" />}
            </div>

            {link.description && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{link.description}</p>
            )}

            <p className="text-xs text-muted-foreground mt-3 truncate">{new URL(link.url).hostname}</p>
          </div>

          {/* Arrow */}
          <ExternalLink className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
          <Button
            size="sm"
            variant="ghost"
            className="text-xs h-7"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyUrl();
            }}
          >
            <Copy className="h-3.5 w-3.5 mr-1" />
            {copied ? "Copied" : "Copy"}
          </Button>

          {isOwner && (
            <>
              <div className="flex-1" />
              <div className="relative">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                >
                  ⋮
                </Button>

                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-background border border-border rounded-lg shadow-lg z-50 min-w-[120px] overflow-hidden">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit?.(link);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-primary/10 transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5 inline mr-1.5" /> Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPin?.(link.id, !link.pinned);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-primary/10 transition-colors"
                    >
                      <Pin className="h-3.5 w-3.5 inline mr-1.5" />
                      {link.pinned ? "Unpin" : "Pin"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.(link.id);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-red-500/10 text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5 inline mr-1.5" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

interface LinksChannelProps {
  roomId: string;
  token: string;
  isOwner: boolean;
  links: LinkDTO[];
  onLinksChange: (links: LinkDTO[]) => void;
  loading: boolean;
}

export function LinksChannel({ roomId, token, isOwner, links, onLinksChange, loading }: LinksChannelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkDTO | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(links.map((l) => l.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [links]);

  const pinnedLinks = useMemo(() => links.filter((l) => l.pinned), [links]);
  const regularLinks = useMemo(() => links.filter((l) => !l.pinned), [links]);

  const filteredLinks = useMemo(() => {
    let filtered = [...pinnedLinks, ...regularLinks];

    if (selectedCategory) {
      filtered = filtered.filter((l) => l.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.title.toLowerCase().includes(query) ||
          l.description.toLowerCase().includes(query) ||
          l.url.toLowerCase().includes(query) ||
          l.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [pinnedLinks, regularLinks, selectedCategory, searchQuery]);

  const handleAddLink = useCallback(
    async (data: Omit<LinkDTO, "id" | "roomId" | "createdAt" | "updatedAt" | "displayOrder">) => {
      try {
        const response = await fetch("/api/links/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, token, ...data }),
        });

        if (response.ok) {
          const result = await response.json() as { link: LinkDTO };
          onLinksChange([...links, result.link]);
          setShowAddModal(false);
        }
      } catch (error) {
        console.error("Error adding link:", error);
      }
    },
    [roomId, token, links, onLinksChange]
  );

  const handleDeleteLink = useCallback(
    async (linkId: string) => {
      if (!confirm("Delete this link?")) return;

      try {
        const response = await fetch("/api/links/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, token, linkId }),
        });

        if (response.ok) {
          onLinksChange(links.filter((l) => l.id !== linkId));
        }
      } catch (error) {
        console.error("Error deleting link:", error);
      }
    },
    [roomId, token, links, onLinksChange]
  );

  const handlePinLink = useCallback(
    async (linkId: string, pinned: boolean) => {
      try {
        const response = await fetch("/api/links/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, token, linkId, pinned }),
        });

        if (response.ok) {
          const result = await response.json() as { link: LinkDTO };
          onLinksChange(links.map((l) => (l.id === linkId ? result.link : l)));
        }
      } catch (error) {
        console.error("Error updating link:", error);
      }
    },
    [roomId, token, links, onLinksChange]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-sm font-bold tracking-[0.12em] uppercase">◈ links</h2>
            <p className="text-xs text-muted-foreground mt-1">Useful websites, projects, tools & resources</p>
          </div>
          {isOwner && (
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Link
            </Button>
          )}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search links..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-background border border-border rounded px-3 py-2 text-xs placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />

        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "px-3 py-1 rounded text-xs transition-colors",
                selectedCategory === null ? "bg-primary text-primary-foreground" : "bg-background border border-border hover:border-primary"
              )}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-3 py-1 rounded text-xs transition-colors",
                  selectedCategory === cat ? "bg-primary text-primary-foreground" : "bg-background border border-border hover:border-primary"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Loading links...
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Globe className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm font-semibold">No links yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isOwner ? "Add your first link to get started" : "Owner hasn't added any links yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLinks.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                isOwner={isOwner}
                onEdit={setEditingLink}
                onDelete={handleDeleteLink}
                onPin={handlePinLink}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
