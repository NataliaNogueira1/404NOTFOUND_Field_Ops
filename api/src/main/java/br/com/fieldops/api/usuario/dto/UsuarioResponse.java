package br.com.fieldops.api.usuario.dto;

import br.com.fieldops.api.usuario.domain.Perfil;

/**
 * Public representation of a user. Never exposes {@code senha}.
 */
public record UsuarioResponse(Long id, String nome, String email, Perfil perfil) {
}
