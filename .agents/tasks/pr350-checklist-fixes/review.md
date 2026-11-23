# Revisão — fix/mobile-keyboard-avoiding-number-field

## Evidência de build/testes

Commit `6be159e` registra a execução pós-merge com `origin/develop`:
- `npx tsc --noEmit` → 0 erros
- `npm test` → 20 suites, 334 testes, todos passando

---

## Verificação dos quatro requisitos

### 1. Posição Y via `measureLayout` em relação ao `ScrollView`

**Arquivo:** `mobile/src/components/fieldops/ChecklistItemCard.tsx`

O card envolve seu conteúdo em `<View ref={cardRef}>` e chama:

```ts
cardRef.current.measureLayout(
  scrollRef.current as unknown as React.ElementRef<typeof View>,
  (_x, y) => { onInputFocus(y); },
  () => { /* fallback: no-op */ },
);
```

`scrollRef.current` é do tipo `PublicScrollViewInstance`, que por definição no código-fonte RN 0.88 é `Object.assign(nativeInstance, {...methods})` onde `nativeInstance` é uma `ReactNativeElement`. O guard `if (!(relativeToNativeNode instanceof ReactNativeElement))` passa. A assinatura de `ReactNativeElement.measureLayout` é `(relativeToNativeNode, onSuccess, onFail?)` — a ordem dos callbacks bate.

A prop `scrollRef` é declarada no tipo `ChecklistItemProps` e passada de `checklist.tsx` em cada `<ChecklistItemCard scrollRef={scrollRef} .../>`. O `y` retornado é relativo ao `ScrollView`, não ao pai imediato, resolvendo o problema de múltiplas seções.

**✅ Requisito atendido.**

---

### 2. `keyboardVerticalOffset` e `behavior` Android

**Arquivo:** `mobile/app/(protected)/inspections/[id]/checklist.tsx`

```tsx
const KEYBOARD_VERTICAL_OFFSET = 0;
// ...
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
  keyboardVerticalOffset={KEYBOARD_VERTICAL_OFFSET}
>
```

- Offset é `0` em ambas as plataformas. O comentário explica que `_layout.tsx` já aplica `paddingTop: insets.top` via `useSafeAreaInsets`, e o Stack tem `headerShown: false`, portanto não há header a compensar.
- Verificado em `_layout.tsx`: `<View style={[styles.container, { paddingTop: insets.top }]}>` confirma o raciocínio.
- Android usa `behavior={undefined}`, evitando duplo ajuste com `adjustResize`.

**✅ Requisito atendido.**

---

### 3. `InputAccessoryView` em um único lugar no nível de tela

**Arquivo:** `mobile/app/(protected)/inspections/[id]/checklist.tsx`

```tsx
{Platform.OS === 'ios' ? (
  <InputAccessoryView nativeID={NUMERIC_ACCESSORY_ID}>
    ...
  </InputAccessoryView>
) : null}
```

`ChecklistItemCard.tsx` não importa `InputAccessoryView` — importa apenas a constante `NUMERIC_ACCESSORY_ID` exportada. Cada `TextInput` NUMBER no card usa apenas `inputAccessoryViewID={Platform.OS === 'ios' ? NUMERIC_ACCESSORY_ID : undefined}`. O `InputAccessoryView` renderiza via `RCTInputAccessoryViewNativeComponent` com `position: 'absolute'`; sua posição na árvore React não importa para o iOS, mas há um único `nativeID` no ar.

**✅ Requisito atendido.**

---

### 4. `returnKeyType="done"` no `TextInput` numérico

**Arquivo:** `mobile/src/components/fieldops/ChecklistItemCard.tsx`, função `AnswerControl`

```tsx
if (item.responseType === ResponseType.NUMBER) return (
  <TextInput
    keyboardType="numeric"
    returnKeyType="done"
    inputAccessoryViewID={Platform.OS === 'ios' ? NUMERIC_ACCESSORY_ID : undefined}
    ...
  />
);
```

A prop está presente no código final. O comentário no próprio código esclarece que teclados numéricos iOS não exibem a tecla Return, mas `returnKeyType="done"` garante o comportamento correto em Android e é inofensivo no iOS.

**✅ Requisito atendido.**

---

## Verificações adicionais de correção

- **`onFocus` propagado a TEXT_SHORT e TEXT_LONG:** os dois `TextInput` de texto também recebem `onFocus={onFocus}`, o que é coerente com o objetivo de scroll-to-focused para qualquer campo editável.
- **`keyboardDismissMode="on-drag"`** adicionado ao `ScrollView`: comportamento razoável e não viola nenhum requisito aprovado.
- **`paddingBottom: Spacing.xxl * 2`**: aumento do espaço inferior para garantir que o último item fique visível acima do teclado. Dentro do escopo da issue.
- **Cast `as unknown as React.ElementRef<typeof View>`**: necessário porque o tipo de `scrollRef.current` é `PublicScrollViewInstance` (que estende `HostInstance` = `ReactNativeElement`). A implementação real passa a verificação `instanceof ReactNativeElement`. O cast não esconde erro de runtime — tsc zero erros confirmado.

---

## Conclusão

Todos os quatro requisitos da revisão foram implementados corretamente. Build e testes passando pós-merge. Sem blockers.
