package com.fieldops.user.controller;

import com.fieldops.user.model.Role;
import com.fieldops.user.model.User;
import com.fieldops.user.model.UserStatus;
import com.fieldops.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@WithMockUser(authorities = "ADMINISTRATOR")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void createsUserWithHashedPasswordAndCompleteResponse() throws Exception {
        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"  Maria Souza  ","email":"MARIA@EXAMPLE.COM",
                                 "password":"secret1","role":"TECHNICIAN","phone":"(11) 99999-0000"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", org.hamcrest.Matchers.matchesPattern("/api/v1/users/\\d+")))
                .andExpect(jsonPath("$.name").value("Maria Souza"))
                .andExpect(jsonPath("$.email").value("maria@example.com"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.phone").value("(11) 99999-0000"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.version").value(0));

        User saved = userRepository.findByEmail("maria@example.com").orElseThrow();
        assertThat(saved.getPassword()).isNotEqualTo("secret1");
        assertThat(passwordEncoder.matches("secret1", saved.getPassword())).isTrue();
    }

    @Test
    void filtersAndPaginatesUsers() throws Exception {
        persist("Ana Tecnica", "ana.tech@example.com", Role.TECHNICIAN, UserStatus.ACTIVE);
        persist("Bruno Supervisor", "bruno.sup@example.com", Role.SUPERVISOR, UserStatus.INACTIVE);

        mockMvc.perform(get("/api/v1/users")
                        .param("name", "ana.tech")
                        .param("role", "TECHNICIAN")
                        .param("status", "ACTIVE")
                        .param("page", "0")
                        .param("size", "1")
                        .param("sort", "name,asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].email").value("ana.tech@example.com"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.size").value(1));
    }

    @Test
    void updatesUserWithoutReplacingPasswordWhenItIsOmitted() throws Exception {
        User user = persist("Original", "original@example.com", Role.TECHNICIAN, UserStatus.ACTIVE);
        String originalHash = user.getPassword();

        mockMvc.perform(put("/api/v1/users/{id}", user.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Atualizado","email":"updated@example.com",
                                 "role":"SUPERVISOR","phone":"11999990000"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Atualizado"))
                .andExpect(jsonPath("$.role").value("SUPERVISOR"));

        User updated = userRepository.findById(user.getId()).orElseThrow();
        assertThat(updated.getPassword()).isEqualTo(originalHash);
    }

    @Test
    void inactivatesWithoutDeleting() throws Exception {
        User user = persist("Conta Ativa", "active@example.com", Role.TECHNICIAN, UserStatus.ACTIVE);

        mockMvc.perform(patch("/api/v1/users/{id}/status", user.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"INACTIVE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INACTIVE"));

        assertThat(userRepository.findById(user.getId())).isPresent()
                .get().extracting(User::getStatus).isEqualTo(UserStatus.INACTIVE);
    }

    @Test
    void validatesPayloadAndEmailAvailability() throws Exception {
        User user = persist("Existente", "exists@example.com", Role.TECHNICIAN, UserStatus.ACTIVE);

        mockMvc.perform(get("/api/v1/users/email-availability")
                        .param("email", "exists@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(false));

        mockMvc.perform(get("/api/v1/users/email-availability")
                        .param("email", "exists@example.com")
                        .param("excludeId", user.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(true));

        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\",\"email\":\"invalid\",\"password\":\"123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    @WithMockUser(authorities = "SUPERVISOR")
    void forbidsSupervisor() throws Exception {
        mockMvc.perform(get("/api/v1/users"))
                .andExpect(status().isForbidden());
    }

    private User persist(String name, String email, Role role, UserStatus status) {
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode("secret1"));
        user.setRole(role);
        user.setStatus(status);
        return userRepository.saveAndFlush(user);
    }
}
