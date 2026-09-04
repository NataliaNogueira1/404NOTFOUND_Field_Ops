package com.fieldops.client.repository;

import com.fieldops.client.model.Client;
import com.fieldops.client.model.ClientStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long>, JpaSpecificationExecutor<Client> {

    Page<Client> findByStatus(ClientStatus status, Pageable pageable);

    @Query("SELECT c FROM Client c WHERE c.status = :status AND " +
           "(LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.document) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Client> findByStatusAndSearch(@Param("status") ClientStatus status,
                                       @Param("search") String search,
                                       Pageable pageable);

    Optional<Client> findByDocument(String document);

    boolean existsByDocument(String document);
}
