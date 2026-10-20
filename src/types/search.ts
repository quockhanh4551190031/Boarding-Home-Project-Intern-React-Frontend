export interface PostSearchItem {
    id: number;
    title: string;
    snippet: string;
    authorId: number;
    authorName: string;
    likeCount: number;
    commentCount: number;
    createdAt: string;
}

export interface UserSearchItem {
    id: number;
    name: string;
    role: "TENANT" | "LANDLORD";
}

export interface SearchResult {
    posts: PostSearchItem[];
    users: UserSearchItem[];
}