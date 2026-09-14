---
inclusion: manual
---

# FieldOps — Especificação Completa do Backend (API REST)

## Stack Tecnológico

- **Linguagem:** Java 17+
- **Framework:** Spring Boot 3.x
- **ORM:** Spring Data JPA (Hibernate)
- **Banco:** PostgreSQL 15+
- **Migrações:** Flyway ou Liquibase
- **Segurança:** Spring Security + JWT (jjwt ou similar)
- **Validação:** Bean Validation (Jakarta Validation)
- **Documentação:** SpringDoc OpenAPI (Swagger UI)
- **Upload:** Spring Multipart + armazenamento local (dev) ou S3 (prod)
- **Testes:** JUnit 5 + Mockito + Testcontainers (opcional)
- **Build:** Maven ou Gradle
- **Container:** Dockerfile + docker-compose (PostgreSQL + API)

## Estrutura de Pacotes (por feature)

```
com.fieldops/
├── FieldOpsApplication.java
├── config/
│   ├── SecurityConfig.java
│   ├── CorsConfig.java
│   ├── JwtConfig.java
│   ├── OpenApiConfig.java
│   └── StorageConfig.java
├── shared/
│   ├── exception/
│   │   ├── GlobalExceptionHandler.java
│   │   ├── BusinessException.java
│   │   ├── ResourceNotFoundException.java
│   │   ├── ConflictException.java
│   │   └── ErrorResponse.java
│   ├── dto/
│   │   ├── PageResponse.java
│   │   └── IdResponse.java
│   ├── security/
│   │   ├── JwtTokenProvider.java
│   │   ├── JwtAuthenticationFilter.java
│   │   ├── UserDetailsImpl.java
│   │   └── SecurityUtils.java
│   ├── audit/
│   │   └── AuditService.java
│   └── validation/
│       └── EnumValidator.java
├── auth/
│   ├── AuthController.java
│   ├── AuthService.java
│   ├── dto/
│   │   ├── LoginRequest.java
│   │   ├── LoginResponse.java
│   │   ├── RefreshRequest.java
│   │   └── UserProfileResponse.java
│   └── RefreshTokenRepository.java
├── user/
│   ├── UserController.java
│   ├── UserService.java
│   ├── User.java (entity)
│   ├── UserRepository.java
│   ├── dto/
│   │   ├── CreateUserRequest.java
│   │   ├── UpdateUserRequest.java
│   │   ├── UserResponse.java
│   │   └── UserStatusRequest.java
│   └── UserMapper.java
├── client/
│   ├── ClientController.java
│   ├── ClientService.java
│   ├── Client.java
│   ├── ClientRepository.java
│   ├── dto/ ...
│   └── ClientMapper.java
├── site/
│   ├── SiteController.java
│   ├── SiteService.java
│   ├── InspectionSite.java
│   ├── SiteRepository.java
│   ├── dto/ ...
│   └── SiteMapper.java
├── equipment/
│   ├── EquipmentController.java
│   ├── EquipmentService.java
│   ├── Equipment.java
│   ├── EquipmentRepository.java
│   ├── dto/ ...
│   └── EquipmentMapper.java
├── template/
│   ├── TemplateController.java
│   ├── TemplateService.java
│   ├── InspectionTemplate.java
│   ├── InspectionTemplateVersion.java
│   ├── TemplateSection.java
│   ├── TemplateItem.java
│   ├── TemplateRepository.java
│   ├── VersionRepository.java
│   ├── dto/ ...
│   └── TemplateMapper.java
├── inspection/
│   ├── InspectionController.java
│   ├── InspectionService.java
│   ├── Inspection.java
│   ├── InspectionItemSnapshot.java
│   ├── InspectionResponse.java
│   ├── InspectionRepository.java
│   ├── ResponseRepository.java
│   ├── SnapshotRepository.java
│   ├── dto/ ...
│   └── InspectionMapper.java
├── evidence/
│   ├── EvidenceController.java
│   ├── EvidenceService.java
│   ├── Evidence.java
│   ├── EvidenceRepository.java
│   ├── StorageService.java (interface)
│   ├── LocalStorageService.java
│   ├── dto/ ...
│   └── EvidenceMapper.java
├── nonconformity/
│   ├── NonConformityController.java
│   ├── NonConformityService.java
│   ├── NonConformity.java
│   ├── NonConformityRepository.java
│   ├── dto/ ...
│   └── NonConformityMapper.java
├── review/
│   ├── ReviewController.java
│   ├── ReviewService.java
│   ├── InspectionReview.java
│   ├── ReviewRepository.java
│   ├── dto/ ...
│   └── ReviewMapper.java
├── synchronization/
│   ├── SyncController.java
│   ├── SyncService.java
│   ├── dto/
│   │   ├── SyncPushRequest.java
│   │   ├── SyncOperation.java
│   │   ├── SyncPushResponse.java
│   │   ├── SyncOperationResult.java
│   │   └── SyncPullResponse.java
│   └── IdempotencyStore.java
└── audit/
    ├── AuditEvent.java
    ├── AuditEventRepository.java
    └── AuditController.java
```

---

## Autenticação e Autorização

### JWT Flow
1. Login: valida email+senha → gera accessToken (15min) + refreshToken (7 dias)
2. Cada request: filter extrai Bearer token → valida → injeta UserDetails no SecurityContext
3. Refresh: valida refreshToken → gera novo accessToken
4. Logout: invalida refreshToken (blacklist ou delete)

### Anotações de Segurança
```java
@PreAuthorize("hasRole('ADMIN')")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
@PreAuthorize("hasRole('TECHNICIAN') and @inspectionSecurity.isAssignedTo(#id, authentication)")
```

### SecurityConfig
```java
http
  .csrf(csrf -> csrf.disable())
  .sessionManagement(sm -> sm.sessionCreationPolicy(STATELESS))
  .authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/v1/auth/**").permitAll()
    .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
    .requestMatchers("/api/v1/users/**").hasRole("ADMIN")
    .requestMatchers("/api/v1/mobile/**").hasRole("TECHNICIAN")
    .anyRequest().authenticated()
  )
  .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
```

---

## Validação e Tratamento de Erros

### Bean Validation nos DTOs
```java
public record CreateUserRequest(
    @NotBlank @Size(max = 100) String name,
    @NotBlank @Email String email,
    @NotBlank @Size(min = 6) String password,
    @NotNull Role role
) {}
```

### GlobalExceptionHandler
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    // MethodArgumentNotValidException → 400 com fieldErrors
    // BusinessException → 422 com code + message
    // ResourceNotFoundException → 404
    // ConflictException → 409
    // AccessDeniedException → 403
    // Exception genérica → 500 sem stack trace
}
```

### ErrorResponse padrão
```java
public record ErrorResponse(
    Instant timestamp,
    int status,
    String code,
    String message,
    String path,
    String requestId,
    List<FieldError> fieldErrors
) {}
```

---

## Lógica de Criação de Inspeção (Snapshot)

```java
@Transactional
public InspectionResponse createInspection(CreateInspectionRequest request) {
    // 1. Validar versão publicada
    var version = versionRepository.findById(request.templateVersionId())
        .orElseThrow(() -> new ResourceNotFoundException("Versão não encontrada"));
    
    // 2. Validar vínculos (cliente → local → equipamento)
    validateRelationships(request);
    
    // 3. Validar técnico ativo
    var technician = userRepository.findActiveById(request.technicianId())
        .orElseThrow(() -> new BusinessException("TECHNICIAN_NOT_ACTIVE"));
    
    // 4. Criar inspeção
    var inspection = Inspection.builder()
        .id(UUID.randomUUID())
        .templateVersionId(version.getId())
        .clientId(request.clientId())
        .siteId(request.siteId())
        .equipmentId(request.equipmentId())
        .technicianId(request.technicianId())
        .status(InspectionStatus.ASSIGNED)
        .priority(request.priority())
        .scheduledFor(request.scheduledFor())
        .build();
    
    // 5. Criar snapshots dos itens
    var sections = sectionRepository.findByVersionIdOrderByDisplayOrder(version.getId());
    for (var section : sections) {
        var items = itemRepository.findBySectionIdOrderByDisplayOrder(section.getId());
        for (var item : items) {
            var snapshot = InspectionItemSnapshot.builder()
                .id(UUID.randomUUID())
                .inspectionId(inspection.getId())
                .sourceTemplateItemId(item.getId())
                .sectionTitle(section.getTitle())
                .sectionOrder(section.getDisplayOrder())
                .itemTitle(item.getTitle())
                .itemDescription(item.getDescription())
                .responseType(item.getResponseType())
                .required(item.isRequired())
                .rulesJson(buildRulesJson(item))
                .optionsJson(item.getOptionsJson())
                .itemOrder(item.getDisplayOrder())
                .build();
            snapshotRepository.save(snapshot);
        }
    }
    
    // 6. Registrar auditoria
    auditService.record(AuditAction.INSPECTION_CREATED, inspection);
    
    return inspectionMapper.toResponse(inspectionRepository.save(inspection));
}
```

---

## Sincronização (Endpoint Principal)

### POST /api/v1/mobile/sync/push

```java
@PostMapping("/api/v1/mobile/sync/push")
@PreAuthorize("hasRole('TECHNICIAN')")
public SyncPushResponse pushOperations(@RequestBody SyncPushRequest request) {
    var results = new ArrayList<SyncOperationResult>();
    
    for (var operation : request.operations()) {
        try {
            // Verificar idempotência
            var existing = idempotencyStore.find(operation.operationId());
            if (existing.isPresent()) {
                results.add(new SyncOperationResult(
                    operation.operationId(), "ALREADY_APPLIED", existing.get().entityVersion()
                ));
                continue;
            }
            
            // Processar conforme tipo
            var result = switch (operation.entityType()) {
                case "INSPECTION_RESPONSE" -> processResponse(operation);
                case "EVIDENCE" -> processEvidence(operation);
                case "NON_CONFORMITY" -> processNonConformity(operation);
                case "INSPECTION" -> processInspectionTransition(operation);
                default -> SyncOperationResult.rejected("Tipo desconhecido");
            };
            
            // Registrar idempotência
            if (result.status().equals("APPLIED")) {
                idempotencyStore.save(operation.operationId(), result);
            }
            
            results.add(result);
        } catch (OptimisticLockException e) {
            results.add(new SyncOperationResult(
                operation.operationId(), "CONFLICT", null
            ));
        }
    }
    
    return new SyncPushResponse(results, Instant.now());
}
```

### GET /api/v1/mobile/sync/pull?cursor={cursor}

```java
@GetMapping("/api/v1/mobile/sync/pull")
@PreAuthorize("hasRole('TECHNICIAN')")
public SyncPullResponse pullChanges(@RequestParam(required = false) String cursor) {
    var technicianId = SecurityUtils.getCurrentUserId();
    var since = cursor != null ? Instant.parse(cursor) : Instant.EPOCH;
    
    // Buscar inspeções atualizadas desde o cursor
    var inspections = inspectionRepository
        .findByTechnicianAndUpdatedAfter(technicianId, since);
    
    // Buscar dados relacionados
    var clients = ...; var sites = ...; var equipment = ...;
    var snapshots = ...; var reviews = ...;
    
    var nextCursor = Instant.now().toString();
    
    return new SyncPullResponse(inspections, clients, sites, equipment, 
                                 snapshots, reviews, nextCursor);
}
```

---

## Transições de Estado (State Machine)

```java
public enum InspectionStatus {
    DRAFT, ASSIGNED, IN_PROGRESS, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, CANCELED;
    
    private static final Map<InspectionStatus, Set<InspectionStatus>> TRANSITIONS = Map.of(
        DRAFT, Set.of(ASSIGNED),
        ASSIGNED, Set.of(IN_PROGRESS, CANCELED),
        IN_PROGRESS, Set.of(SUBMITTED, CANCELED),
        SUBMITTED, Set.of(UNDER_REVIEW),
        UNDER_REVIEW, Set.of(APPROVED, REJECTED),
        REJECTED, Set.of(IN_PROGRESS, CANCELED),
        APPROVED, Set.of(), // terminal
        CANCELED, Set.of()  // terminal
    );
    
    public boolean canTransitionTo(InspectionStatus target) {
        return TRANSITIONS.getOrDefault(this, Set.of()).contains(target);
    }
}
```

---

## Migrações (Flyway)

```
resources/db/migration/
├── V1__create_users_table.sql
├── V2__create_clients_sites_equipment.sql
├── V3__create_templates.sql
├── V4__create_inspections.sql
├── V5__create_responses_evidence.sql
├── V6__create_non_conformities.sql
├── V7__create_reviews.sql
├── V8__create_audit_events.sql
├── V9__create_idempotency_store.sql
└── V10__seed_demo_data.sql
```

---

## Docker Compose (Desenvolvimento)

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: fieldops
      POSTGRES_USER: fieldops
      POSTGRES_PASSWORD: fieldops123
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  api:
    build: .
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/fieldops
      SPRING_DATASOURCE_USERNAME: fieldops
      SPRING_DATASOURCE_PASSWORD: fieldops123
      JWT_SECRET: super-secret-key-for-dev
      STORAGE_PATH: /app/uploads
    ports:
      - "8080:8080"
    depends_on:
      - postgres

volumes:
  pgdata:
```

---

## Dados de Demonstração (V10__seed_demo_data.sql)

```sql
-- Admin
INSERT INTO users (id, name, email, password_hash, role, status) VALUES
('uuid-admin', 'Ana Administradora', 'admin@fieldops.local', '$bcrypt...', 'ADMIN', 'ACTIVE');

-- Supervisor
INSERT INTO users (id, name, email, password_hash, role, status) VALUES
('uuid-supervisor', 'Marina Supervisora', 'supervisor@fieldops.local', '$bcrypt...', 'SUPERVISOR', 'ACTIVE');

-- Técnico
INSERT INTO users (id, name, email, password_hash, role, status) VALUES
('uuid-technician', 'Carlos Técnico', 'tecnico@fieldops.local', '$bcrypt...', 'TECHNICIAN', 'ACTIVE');

-- Cliente + Local + Equipamento
INSERT INTO clients (id, name, status) VALUES ('uuid-client', 'Indústria Modelo', 'ACTIVE');
INSERT INTO inspection_sites (id, client_id, name, city, state, status) VALUES
('uuid-site', 'uuid-client', 'Unidade Sorocaba', 'Sorocaba', 'SP', 'ACTIVE');
INSERT INTO equipment (id, site_id, name, qr_code, status) VALUES
('uuid-equip', 'uuid-site', 'Compressor XPTO 500', 'COMP-004', 'ACTIVE');

-- Modelo + Versão + Seções + Itens (completo para demo)
...
```

**Credenciais de demo:**
- Admin: admin@fieldops.local / admin123
- Supervisor: supervisor@fieldops.local / supervisor123
- Técnico: tecnico@fieldops.local / tecnico123

---

## Checklist de Entrega do Backend

- [ ] API executável com `docker-compose up`
- [ ] PostgreSQL com migrações automáticas
- [ ] Swagger UI acessível em /swagger-ui.html
- [ ] Autenticação JWT funcionando
- [ ] Autorização por perfil em todos endpoints
- [ ] CRUD completo: users, clients, sites, equipment
- [ ] Modelos com seções, itens, publicação de versão
- [ ] Criação de inspeção com snapshot
- [ ] Transições de estado validadas
- [ ] Endpoint de respostas (individual e batch)
- [ ] Upload de evidências (multipart)
- [ ] CRUD de não conformidades
- [ ] Revisão: begin-review, approve, reject
- [ ] Sincronização: push (idempotente) + pull (cursor)
- [ ] Auditoria de ações críticas
- [ ] Paginação + filtros em listagens
- [ ] Erros padronizados (sem stack trace)
- [ ] Dados de demonstração
- [ ] README com instruções de execução
- [ ] OpenAPI completo e atualizado
