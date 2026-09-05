package com.fieldops.user.service;

import com.fieldops.shared.exception.BusinessException;
import com.fieldops.shared.exception.ResourceNotFoundException;
import com.fieldops.user.dto.CreateUserRequest;
import com.fieldops.user.dto.UpdateUserRequest;
import com.fieldops.user.mapper.UserMapper;
import com.fieldops.user.model.Role;
import com.fieldops.user.model.User;
import com.fieldops.user.model.UserStatus;
import com.fieldops.user.dto.UserResponse;
import com.fieldops.user.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, UserMapper userMapper,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Finds users for the administrator list while keeping filtering and pagination in the database.
     */
    @Transactional(readOnly = true)
    public Page<UserResponse> list(String query, Role role, UserStatus status, Pageable pageable) {
        Specification<User> filters = (root, criteriaQuery, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (query != null && !query.isBlank()) {
                String pattern = "%" + query.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("name")), pattern),
                        builder.like(builder.lower(root.get("email")), pattern)));
            }
            if (role != null) {
                predicates.add(builder.equal(root.get("role"), role));
            }
            if (status != null) {
                predicates.add(builder.equal(root.get("status"), status));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
        return userRepository.findAll(filters, pageable).map(userMapper::toResponse);
    }

    /**
     * Creates an active user and hashes the submitted password before persistence.
     */
    @Transactional
    public UserResponse create(CreateUserRequest request) {
        String email = normalizeEmail(request.email());
        ensureEmailAvailable(email, null);
        User user = new User();
        applyCommonFields(user, request.name(), email, request.role(), request.phone());
        user.setPassword(passwordEncoder.encode(request.password()));
        return userMapper.toResponse(userRepository.saveAndFlush(user));
    }

    /**
     * Updates user profile fields and preserves the password when none is submitted.
     */
    @Transactional
    public UserResponse update(Long id, UpdateUserRequest request) {
        User user = getRequired(id);
        String email = normalizeEmail(request.email());
        ensureEmailAvailable(email, id);
        applyCommonFields(user, request.name(), email, request.role(), request.phone());
        if (request.password() != null) {
            user.setPassword(passwordEncoder.encode(request.password()));
        }
        return userMapper.toResponse(userRepository.saveAndFlush(user));
    }

    /**
     * Applies the logical activation state without deleting the user record.
     */
    @Transactional
    public UserResponse updateStatus(Long id, UserStatus status) {
        if (status == UserStatus.BLOCKED) {
            throw new BusinessException("Only ACTIVE or INACTIVE are accepted by this operation");
        }
        User user = getRequired(id);
        user.setStatus(status);
        return userMapper.toResponse(userRepository.saveAndFlush(user));
    }

    /**
     * Checks email uniqueness, optionally ignoring the user currently being edited.
     */
    @Transactional(readOnly = true)
    public boolean isEmailAvailable(String email, Long excludeId) {
        String normalized = normalizeEmail(email);
        return excludeId == null
                ? !userRepository.existsByEmailIgnoreCase(normalized)
                : !userRepository.existsByEmailIgnoreCaseAndIdNot(normalized, excludeId);
    }

    private User getRequired(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private void ensureEmailAvailable(String email, Long excludeId) {
        if (!isEmailAvailable(email, excludeId)) {
            throw new BusinessException("Email is already in use");
        }
    }

    private void applyCommonFields(User user, String name, String email, Role role, String phone) {
        user.setName(name.trim());
        user.setEmail(email);
        user.setRole(role);
        user.setPhone(phone == null || phone.isBlank() ? null : phone.trim());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
