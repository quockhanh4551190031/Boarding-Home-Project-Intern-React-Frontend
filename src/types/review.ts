export type ReviewTargetType = "HOUSE" | "ROOM";

export interface Review {
    id: number;
    authorId: number;
    rating: number;
    comment: string | null;
    authorName: string;
    mine: boolean;
    edited: boolean;
    createdAt: string;
}

export interface ReviewSummary {
    average: number;
    count: number;
    distribution: number[]; // phần tử 0 là số lượt 1 sao ... phần tử 4 là 5 sao
}

export interface ReviewList {
    summary: ReviewSummary;
    reviews: Review[];
    hasMore: boolean;
    myReview: Review | null;
    canReview: boolean;
    cannotReviewReason: string | null;
}

export interface ReviewSummaryItem {
    average: number;
    count: number;
}

export interface ReviewFormData {
    rating: number;
    comment: string;
}

export interface AdminReview {
    id: number;
    targetType: ReviewTargetType;
    targetId: number;
    targetName: string;
    rating: number;
    comment: string | null;
    authorEmail: string;
    createdAt: string;
}