package com.example.demo.domain.post.dto;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

// PostDetailResponse.java
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostDetailResponse {
    private Long postId;
    private Long writerId;
    private String title;
    private String content;
    private String writerNickname; //유저 닉네임
    private int viewCount;
    private LocalDateTime createdAt;
    private List<CommentResponse> comments;
}