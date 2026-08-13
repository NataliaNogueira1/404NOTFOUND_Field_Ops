package com.fieldops.user.dto;

import com.fieldops.user.model.Perfil;

/**
 * Public representation of a user. Never exposes {@code senha}.
 */
public record UsuarioResponse(Long id, String nome, String email, Perfil perfil) {
}
