import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Reply, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Comment {
  id: number;
  userId: number;
  username: string;
  text: string;
  createdAt: string;
  parentCommentId?: number;
}

interface CommentSectionProps {
  submissionId: number;
}

export function CommentSection({ submissionId }: CommentSectionProps) {
  const { user } = useAuth(); // Get the authenticated user

  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const replyInputRef = useRef<HTMLTextAreaElement | null>(null); // Add a ref for the reply input box

  const { data: comments = [], isLoading } = useQuery({
    queryKey: [`/api/submissions/${submissionId}/comments`],
    queryFn: async () => {
      const response = await fetch(`/api/submissions/${submissionId}/comments`);
      if (!response.ok) throw new Error("Failed to fetch comments");
      return response.json();
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (data: { content: string; parentCommentId?: number }) => {
      if (!user) throw new Error("User is not authenticated"); // Ensure user is not null

      const response = await fetch(
        `/api/submissions/${submissionId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            user: { id: user.id, username: user.username, role: user.role },
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to add comment");
      return response.json();
    },
    onSuccess: () => {
      setNewComment("");
      setReplyTo(null);
      queryClient.invalidateQueries({
        queryKey: [`/api/submissions/${submissionId}/comments`],
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    addCommentMutation.mutate({
      content: newComment,
      ...(replyTo && { parentCommentId: replyTo }),
    });
  };

  const handleReplySubmit = (
    e: React.FormEvent,
    parentCommentId: number | null
  ) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    addCommentMutation.mutate({
      content: newComment,
      ...(parentCommentId && { parentCommentId }),
    });
  };

  const topLevelComments = comments.filter((c: Comment) => !c.parentCommentId);
  const replies = comments.filter((c: Comment) => c.parentCommentId);

  const getCommentReplies = (commentId: number) =>
    replies.filter((reply: Comment) => reply.parentCommentId === commentId);

  const CommentCard = ({
    comment,
    isReply = false,
  }: {
    comment: Comment;
    isReply?: boolean;
  }) => (
    <div className={cn("border rounded-lg p-4", isReply ? "ml-8 mt-2" : "")}>
      <div className="flex items-center gap-2 mb-2">
        <User className="h-5 w-5" />
        <span className="font-medium">{comment.username}</span>
        <span className="text-sm text-gray-500">
          {format(new Date(comment.createdAt), "MMM dd, yyyy HH:mm")}
        </span>
      </div>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">
        {comment.text}
      </p>
      {!isReply && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
        >
          <Reply className="h-4 w-4 mr-1" />
          Reply
        </Button>
      )}
      {replyTo === comment.id && (
        <form
          onSubmit={(e) => handleReplySubmit(e, comment.id)}
          className="mt-4"
        >
          <Textarea
            ref={replyInputRef} // Attach the ref to the Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyUp={() => replyInputRef.current?.focus()} // Ensure focus remains on the input
            placeholder="Write a reply..."
            className="mb-2"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setReplyTo(null);
                setNewComment("");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Reply
            </Button>
          </div>
        </form>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded" />
            <div className="h-20 bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comments {comments.length > 0 && `(${comments.length})`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="mb-6">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="mb-2"
          />
          <div className="flex justify-end">
            <Button type="submit">Add Comment</Button>
          </div>
        </form>

        <div className="space-y-4">
          {topLevelComments.map((comment: Comment) => (
            <div key={comment.id}>
              <CommentCard comment={comment} />
              {getCommentReplies(comment.id).map((reply: Comment) => (
                <CommentCard key={reply.id} comment={reply} isReply />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
