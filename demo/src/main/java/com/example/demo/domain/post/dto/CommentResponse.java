package com.example.demo.domain.post.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentResponse {
    private Long commentId;
    private Long postId;
    private Long writerId;
    private String writerNickname;
    private String content;
    private LocalDateTime createdAt;
}