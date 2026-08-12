package br.com.fieldops.api.usuario.model;

/**
 * User profiles. Members are code, not copy: the English name is persisted and used as the
 * Spring Security authority. Portuguese display labels belong at the presentation edge.
 *
 * <ul>
 *     <li>{@link #TECHNICIAN} — field technician (Portuguese: Técnico)</li>
 *     <li>{@link #SUPERVISOR} — supervisor (Portuguese: Supervisor)</li>
 *     <li>{@link #ADMINISTRATOR} — administrator (Portuguese: Administrador)</li>
 * </ul>
 */
public enum Perfil {
    TECHNICIAN,
    SUPERVISOR,
    ADMINISTRATOR
}
