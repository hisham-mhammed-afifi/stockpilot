# Section 6: Async & Side Effects

## Duration: ~35 minutes

---

## Pre-Section Checklist

- [ ] App is running (`ng serve`)
- [ ] Browser open at http://localhost:4200/orders
- [ ] Editor open with `src/app/features/orders/store/orders.store.ts`
- [ ] Orders kanban board is loaded with cards in all four columns
- [ ] DevTools Network tab open (optional, useful for showing cancellation)

---

## Opening (2 min)

**Say:** "In the last section, our CRUD methods used `async/await` with `firstValueFrom`. That works fine for simple cases, but it gives us zero control over what happens when multiple requests overlap. What if the user triggers two loads at once? What if they double-click a delete button? What if they drag three cards in quick succession? This section introduces `rxMethod`, which gives us full RxJS-powered flow control inside our SignalStore."

**Context bridge:** "We already know `withEntities` from Section 5. The Orders store uses the same pattern. What is new here is how we handle the async operations: `rxMethod` with different flattening operators for different scenarios."

---

## Demo Flow

### Demo 1: rxMethod Introduction (~5 min)

**Navigate to:** `src/app/features/orders/store/orders.store.ts`

**Show in editor:**

- Open `src/app/features/orders/store/orders.store.ts`
- Highlight lines 23-29: the CONCEPT comment comparing `rxMethod` vs `async/await`. Read through the bullet points: cancellation, queueing, deduplication, debounce, retry, reactive triggers
- Show line 16: `import { rxMethod } from '@ngrx/signals/rxjs-interop'`
- Show line 17: `import { pipe, tap, switchMap, concatMap, exhaustMap } from 'rxjs'`

**Key talking point:**

> "Think of `rxMethod` as a bridge between SignalStore and RxJS. It creates a method on your store that, when called, pushes a value into an Observable pipeline. Inside that pipeline, you can use any RxJS operator. The key decision is which flattening operator to use: `switchMap`, `concatMap`, or `exhaustMap`. Each one handles overlapping requests differently."

**CONCEPT spotlight:**

- Find the `// CONCEPT: rxMethod vs async/await` comment at line 23 and read it aloud
- Explain: "The rule of thumb is simple. Use `async/await` when you do not care about overlapping requests. Use `rxMethod` when you need to control what happens when a second request arrives while the first is still in flight."

---

### Demo 2: switchMap for Loading (~5 min)

**Navigate to:** `src/app/features/orders/store/orders.store.ts`

**Show in editor:**

- Scroll to lines 75-108: the `loadOrders` rxMethod
- Highlight lines 79-83: the CONCEPT comment for switchMap. Read the user-types-"abc" example
- Show line 84: `switchMap(() => ordersApi.getAll().pipe(...))`
- Show lines 86-94: inside the `tapResponse`, we enrich carts with random statuses for the kanban demo

**Show in browser:**

- Click the "Reload" button quickly several times
- Point out that only one loading bar completes (previous requests are cancelled)
- If Network tab is open, show cancelled requests

**Key talking point:**

> "switchMap says 'only the latest request matters.' When you click Reload twice, the first HTTP request is cancelled and only the second one completes. This prevents stale data from overwriting fresh data. It is the right choice for any data loading scenario."

---

### Demo 3: Kanban Drag-and-Drop (~8 min)

**Navigate to:** `src/app/features/orders/components/orders-kanban.component.ts`

**Show in editor:**

- Open `src/app/features/orders/components/orders-kanban.component.ts`
- Highlight lines 20-22: the container component CONCEPT comment
- Scroll to lines 397-410: the `onDrop` method. Show how it extracts the order and new status from the CDK DragDrop event, then calls `store.updateOrderStatus()`

**Switch to:** `src/app/features/orders/store/orders.store.ts`

- Scroll to lines 117-150: the `updateOrderStatus` rxMethod
- Highlight lines 119-122: the CONCEPT comment about optimistic updates
- Show lines 123-125: the `tap` that calls `patchState(store, updateEntity(...))` BEFORE the API call
- Show lines 127-130: the CONCEPT comment about concatMap queueing

**Show in browser:**

- **WOW MOMENT:** Drag an order card from the "New" column to "Processing"
- The card moves instantly to the new column. Point out that this happened BEFORE the API responded
- Open `src/app/features/orders/services/orders-api.service.ts` and show lines 23-25: the artificial 800ms delay. The card moved instantly, but the API call takes almost a second
- Drag another card while the first API call is still in flight. Both updates complete in order

**Key talking point:**

> "This is the optimistic update pattern. We update the UI first, then send the API call in the background. The user sees instant feedback. If the API fails, we show an error and could roll back. Combined with concatMap, each status update is processed in order, preventing race conditions."

**CONCEPT spotlight:**

- Find the `// CONCEPT: Optimistic Update` comment at line 119 and read it aloud
- Explain: "The optimistic update happens in the `tap` operator, which runs synchronously before the `concatMap` flattens the API call. This is a deliberate placement. If we put the UI update inside the `tapResponse`, the card would not move until the API responded."

---

### Demo 4: concatMap for Status Updates (~5 min)

**Navigate to:** `src/app/features/orders/store/orders.store.ts`

**Show in editor:**

- Scroll to lines 127-130: the concatMap CONCEPT comment
- Show lines 131-149: the full `concatMap` block with `ordersApi.updateStatus` and `tapResponse`

**Show in browser:**

- Rapidly drag three cards to different columns in quick succession
- All three moves happen instantly in the UI (optimistic updates)
- Point out that the API calls execute one at a time, in order

**Key talking point:**

> "concatMap says 'every request matters, and process them in order.' If you move order A, then order B, then order C, the API calls happen sequentially: A finishes, then B starts, then C starts. This prevents the server from receiving out-of-order updates. Compare this with switchMap, which would cancel A and B and only send C."

---

### Demo 5: exhaustMap for Delete (~5 min)

**Navigate to:** `src/app/features/orders/store/orders.store.ts`

**Show in editor:**

- Scroll to lines 156-159: the exhaustMap CONCEPT comment. Read the double-click scenario
- Show lines 160-173: the `deleteOrder` rxMethod with `exhaustMap`
- Highlight line 165: `patchState(store, removeEntity(id))` inside the success handler

**Show in browser:**

- Click the three-dot menu on any order card
- Click "Delete Order"
- Try clicking delete on another card immediately after. The second delete is ignored until the first one completes

**Key talking point:**

> "exhaustMap says 'ignore new requests while one is already in progress.' This is the perfect strategy for delete buttons and form submissions. If the user double-clicks, only the first click fires. The second click is silently dropped. No duplicate API calls, no duplicate deletions."

**CONCEPT spotlight:**

- Find the `// CONCEPT: rxMethod with exhaustMap` comment at line 156 and read it aloud
- Explain: "The distinction between the three operators is subtle but critical. switchMap cancels the old request. concatMap queues the new request. exhaustMap drops the new request. Choose based on what the user expects to happen."

---

### Demo 6: tapResponse (~3 min)

**Navigate to:** `src/app/features/orders/store/orders.store.ts`

**Show in editor:**

- Show lines 96-103: the `tapResponse` inside `loadOrders`. Point out the `next` and `error` handlers
- Highlight lines 96-100: the CONCEPT comment explaining why `tapResponse` is needed

**Show in editor (second file):**

- Open `src/app/features/orders/components/orders-kanban.component.ts`
- Scroll to lines 372-382: the `effect()` in the constructor that watches `store.error()` and shows a snackbar

**Key talking point:**

> "Without `tapResponse`, a single HTTP error would kill the entire rxMethod pipeline. The Observable would complete with an error, and calling `loadOrders()` again would do nothing because the stream is dead. `tapResponse` catches the error inside the inner Observable, so the outer pipeline stays alive. You can call `loadOrders()` again and it will work."

---

### Demo 7: Operator Comparison (~4 min)

**Navigate to:** http://localhost:4200/orders

**Show in browser:**

- Scroll up to the "Async Strategy Guide" panel on the orders page
- Walk through each card: switchMap ("Latest wins"), concatMap ("Queue in order"), exhaustMap ("Ignore while busy")
- Point out the "Used by" labels that connect each operator to its usage in this store

**Show in editor:**

- Open `src/app/features/orders/components/orders-kanban.component.ts`
- Scroll to lines 270-307: the operator demo panel template. Show how it serves as a built-in teaching aid

**Key talking point:**

> "This visual reference stays on screen while the audience experiments with the kanban board. They can drag cards (concatMap), click reload (switchMap), and delete orders (exhaustMap) while seeing the explanation right there on the page."

---

## Audience Interaction Points

- **Ask the audience:** "If you are building a search-as-you-type feature, which operator would you use? Why?" (Answer: switchMap, because you only care about the latest search term)
- **Poll/show of hands:** "Who has experienced a bug caused by a user double-clicking a submit button?"
- **Challenge:** "What would happen if we used `switchMap` instead of `concatMap` for status updates? Think about it: you drag order A to 'shipped', then immediately drag order B to 'delivered'. What happens to order A?" (Answer: order A's API call gets cancelled. The UI shows it as 'shipped' but the server never received the update.)

---

## Common Questions & Answers

**Q: Can I mix rxMethod and async/await in the same store?**
A: Yes, absolutely. Look at the InventoryStore in Section 5. It uses `rxMethod` for `loadProducts` (because it needs switchMap cancellation) but uses `async/await` for `addProduct`, `updateProduct`, and `deleteProduct` (because those are simple fire-and-forget operations). Choose the right tool for each method.

**Q: What about mergeMap? When would I use that?**
A: `mergeMap` runs all requests in parallel with no limit. It is useful when requests are independent and you want maximum throughput, like loading thumbnails for a gallery. But be careful: it can overwhelm the server with concurrent requests. In most store scenarios, `switchMap`, `concatMap`, or `exhaustMap` are better choices.

**Q: How does the optimistic update rollback work in production?**
A: In this workshop, we show a simplified version that displays an error message. In production, you would save a snapshot of the entity before the optimistic update, then restore it in the error handler: `const snapshot = store.entityMap()[id]; tap(() => updateEntity(...)); catchError(() => { patchState(store, updateEntity({ id, changes: snapshot })); })`.

**Q: Does rxMethod automatically unsubscribe when the store is destroyed?**
A: Yes. When a store is destroyed (for example, a feature-scoped store when the route changes), all rxMethod subscriptions are cleaned up automatically. This is one of the advantages over managing subscriptions manually.

**Q: Why use an artificial delay in the API service?**
A: The 800ms delay in `orders-api.service.ts` (line 28) makes the async behavior visible during demos. Without it, the API responses would be so fast that you could not see the difference between optimistic and server-confirmed updates.

---

## Transition to Next Section

**Say:** "We now have full async control with rxMethod and three flattening strategies. But notice we have been writing all this logic directly in each store. In the next section, we will extract reusable patterns into custom SignalStore features, so you can share behavior like loading states, error handling, and API integration across multiple stores with a single function call."

**Action:** Open `src/app/shared/store/` in the editor to preview the custom features we will build next.

---

## Section Cheat Sheet (for quick reference during delivery)

| Concept | Where to find it | Key line |
| --- | --- | --- |
| rxMethod vs async/await | `orders.store.ts:23-29` | `// CONCEPT: rxMethod vs async/await` |
| rxMethod import | `orders.store.ts:16` | `import { rxMethod } from '@ngrx/signals/rxjs-interop'` |
| switchMap (loadOrders) | `orders.store.ts:79-84` | `switchMap(() => ordersApi.getAll().pipe(...))` |
| tapResponse error safety | `orders.store.ts:96-100` | `// CONCEPT: tapResponse` |
| Optimistic update | `orders.store.ts:119-125` | `tap(({ id, status }) => { patchState(store, updateEntity(...)) })` |
| concatMap (updateStatus) | `orders.store.ts:127-131` | `concatMap(({ id, status }) => ordersApi.updateStatus(...))` |
| exhaustMap (deleteOrder) | `orders.store.ts:156-162` | `exhaustMap((id) => ordersApi.deleteOrder(id).pipe(...))` |
| withHooks onInit | `orders.store.ts:184-186` | `// CONCEPT: withHooks` |
| Container component | `orders-kanban.component.ts:20-22` | `// CONCEPT: Architecture - container component` |
| effect() for error snackbar | `orders-kanban.component.ts:372-382` | `effect(() => { const error = this.store.error(); ... })` |
| CDK DragDrop handler | `orders-kanban.component.ts:397-409` | `onDrop(event: CdkDragDrop<OrderStatus>)` |
| Operator comparison panel | `orders-kanban.component.ts:270-307` | Async Strategy Guide template |
| Artificial API delay | `orders-api.service.ts:23-25` | `// CONCEPT: Simulated mutation` with `delay(800)` |
| Client-side enrichment | `order.model.ts:17-19` | `// CONCEPT: Client-side enrichment - "status" does not exist on the API` |
| Presentational card | `order-card.component.ts:11-13` | `// CONCEPT: Architecture - presentational (dumb) component` |
