package com.fieldops.client.dto;

/**
 * Client representation. Part of the initial contract/stub.
 *
 * @param document CNPJ/CPF
 */
public record ClientResponse(
        Long id,
        String name,
        String document,
        String email
) {
}
