"use client";

import { useState } from "react";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { broadcastToTeachers } from "@/app/actions/announcement-actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function AnnouncementButton() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function handleSend() {
    if (!title.trim() || !message.trim()) {
      toast.error("Enter a title and a message first.");
      return;
    }

    setIsSending(true);
    const res = await broadcastToTeachers(title, message);
    setIsSending(false);

    if (res.success) {
      toast.success(`Announcement sent to ${res.recipientCount} teachers`);
      setTitle("");
      setMessage("");
      setOpen(false);
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-emerald-500 hover:bg-emerald-950/30 hover:text-emerald-400"
          title="Send announcement to all teachers"
        >
          <Megaphone className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Announce to all teachers</DialogTitle>
          <DialogDescription>
            This sends the message below to every teacher account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="announcement-title">Title</Label>
            <Input
              id="announcement-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Staff meeting on Friday"
              disabled={isSending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="announcement-message">Message</Label>
            <Textarea
              id="announcement-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write the announcement..."
              rows={5}
              disabled={isSending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSend}
            disabled={isSending}
            className="w-full"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send to all teachers"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
