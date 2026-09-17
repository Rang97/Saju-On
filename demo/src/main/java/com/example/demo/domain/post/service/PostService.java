package com.example.demo.domain.post.service;

import com.example.demo.domain.post.dto.*;
import com.example.demo.domain.post.entity.Post;
import com.example.demo.domain.post.repository.CommentMapper;
import com.example.demo.domain.post.repository.PostMapper;
import com.example.demo.global.common.PageResponse;
import com.example.demo.global.util.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostMapper postMapper;
    private final CommentMapper commentMapper;
    private final CurrentUserProvider currentUserProvider;

    @Transactional
    public Long createPost(PostCreateRequest req) {
        Post post = Post.builder()
                .writerId(currentUserProvider.getCurrentUserId())
                .title(req.getTitle())
                .content(req.getContent())
                .build();
        postMapper.insertPost(post);
        return post.getPostId();
    }

    @Transactional
    public void updatePost(Long postId, PostUpdateRequest req) {
        Long writerId = postMapper.findWriterId(postId);
        if (writerId == null) {
            throw new IllegalArgumentException("게시글을 찾을 수 없습니다.");
        }
        if (!writerId.equals(currentUserProvider.getCurrentUserId())) {
            throw new IllegalArgumentException("수정 권한이 없습니다.");
        }
        Post post = Post.builder().postId(postId).title(req.getTitle()).content(req.getContent()).build();
        postMapper.updatePost(post);
    }

    @Transactional
    public void deletePost(Long postId) {
        Long writerId = postMapper.findWriterId(postId);
        if (writerId == null) {
            throw new IllegalArgumentException("게시글을 찾을 수 없습니다.");
        }
        if (!writerId.equals(currentUserProvider.getCurrentUserId())) {
            throw new IllegalArgumentException("삭제 권한이 없습니다.");
        }
        postMapper.deletePost(postId);
    }

    public PageResponse<PostListResponse> getPostList(int page, int size) {
        Long myId = currentUserProvider.getCurrentUserIdOrNull();
        int offset = page * size;
        List<PostListResponse> posts = postMapper.findVisiblePosts(myId, offset, size);
        int total = postMapper.countVisiblePosts(myId);
        return PageResponse.of(posts, page, size, total);
    }

    @Transactional
    public PostDetailResponse getPostDetail(Long postId) {
        postMapper.increaseViewCount(postId);
        Long myId = currentUserProvider.getCurrentUserId();

        PostDetailResponse baseDetail = postMapper.findPostDetail(postId, myId);
        if (baseDetail == null) {
            throw new IllegalArgumentException("게시글을 찾을 수 없습니다.");
        }

        List<CommentResponse> comments = commentMapper.findVisibleCommentsByPostId(postId, myId);

        return PostDetailResponse.builder()
                .postId(baseDetail.getPostId())
                .writerId(baseDetail.getWriterId())
                .title(baseDetail.getTitle())
                .content(baseDetail.getContent())
                .writerNickname(baseDetail.getWriterNickname())
                .viewCount(baseDetail.getViewCount())
                .createdAt(baseDetail.getCreatedAt())
                .comments(comments)
                .build();
    }
}