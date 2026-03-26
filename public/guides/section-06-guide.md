# Section 06: Async & Side Effects

**Duration:** ~35 minutes
**URL:** http://localhost:4200/orders
**Key Store File:** `src/app/features/orders/store/orders.store.ts` (193 lines)

---

## Pre-Section Checklist

- [ ] Browser open at http://localhost:4200/orders with kanban board loaded (cards in 4 columns)
- [ ] Editor open to `src/app/features/orders/store/orders.store.ts`
- [ ] Second editor tab: `src/app/features/orders/components/orders-kanban.component.ts`
- [ ] Third editor tab: `src/app/features/orders/components/order-card.component.ts`
- [ ] Network tab open, cleared, and set to "XHR" filter
- [ ] Console tab open (for observing optimistic update timing)
- [ ] If possible, enable "Slow 3G" network throttling in DevTools to make async behavior visible (switch back to "No throttling" before drag-and-drop demos)

---

## Opening (2 min)

> "In the Inventory store, we used `async/await` with `firstValueFrom` for CRUD operations. That works fine for simple fire-and-forget calls. But what happens when the user types fast in a search box and triggers five API calls in 200ms? Or drags three cards on the kanban board in quick succession? Or double-clicks a delete button? Plain async/await has no built-in answer for cancellation, queueing, or deduplication. That is where `rxMethod` comes in."

**Key talking point:** `rxMethod` wraps your logic in an RxJS Observable pipeline. The flattening operator you choose (switchMap, concatMap, exhaustMap) determines the async strategy. Same code structure, radically different behavior.

---

## Demo Flow

### Part 1: The Three Operators Mental Model (5 min)

**Browser:** Navigate to http://localhost:4200/orders. Point to the "Async Strategy Guide" panel in the UI (the gray box with three cards).

> "The app itself has a cheat sheet built in. Let me read these out."

1. **switchMap -- "Latest wins."** Used by Load Orders. Cancels the previous request when a new one arrives.
2. **concatMap -- "Queue in order."** Used by Update Status. Processes requests sequentially, one at a time.
3. **exhaustMap -- "Ignore while busy."** Used by Delete Order. Drops new requests while one is in-flight.

**Draw or describe the timeline:**

```
switchMap:   Request A ----X (cancelled)
             Request B ---------> Response B (used)

concatMap:   Request A ---------> Response A
             Request B (queued) ---------> Response B

exhaustMap:  Request A ---------> Response A
             Request B (dropped, ignored)
```

> "Same trigger, same API call, completely different behavior. The operator is the strategy."

**Editor:** Open `src/app/features/orders/store/orders.store.ts`, lines 23-29 -- the CONCEPT comment block. Read it aloud or paraphrase.

### Part 2: switchMap -- Load Orders (8 min)

**Editor:** Show `orders.store.ts`, lines 75-108.

1. **Line 75:** `loadOrders: rxMethod<void>(`
   > "rxMethod<void> means this method takes no arguments. You call it with `store.loadOrders()`. Under the hood, it pushes a value into a Subject, which feeds the Observable pipeline."

2. **Line 77:** `tap(() => patchState(store, { loading: true, error: null }))`
   > "First side effect: set loading to true. This happens synchronously before the HTTP call."

3. **Lines 84-106 -- the switchMap block:**
   ```typescript
   switchMap(() =>
     ordersApi.getAll().pipe(
       tapResponse({
         next: (response: CartsResponse) => { ... },
         error: (err: Error) => { ... },
       })
     )
   )
   ```
   > "switchMap subscribes to the inner Observable (the HTTP call). If loadOrders is called again before the response arrives, switchMap UNSUBSCRIBES from the first call and subscribes to the new one. The first HTTP response is silently discarded."

4. **Lines 87-94 -- the response mapping:**
   > "The DummyJSON carts API does not have an order status field. We enrich each cart with a random status for the kanban demo. In a real app, this mapping would come from the API response."

5. **Lines 96-103 -- tapResponse:**
   > "tapResponse is from `@ngrx/operators`. It is like a try/catch for Observables. The critical difference from plain `catchError`: tapResponse handles the error WITHOUT killing the outer Observable. If we used regular subscribe error handling, one failed API call would permanently break the `loadOrders` pipeline. With tapResponse, the next call to `loadOrders()` still works."

**WOW MOMENT -- Browser demo:**
1. Make sure Network tab is open with XHR filter
2. Click the "Reload" button rapidly 3-4 times in quick succession
3. Watch the Network tab: you will see multiple requests, but all but the last one show as "cancelled"
4. Only the final response populates the board

> "That is switchMap. Four clicks, four HTTP requests started, three cancelled, one response used. No stale data, no race conditions."

**Recovery:** If all requests seem to complete (no cancellation visible), the API may be responding too fast. Enable "Slow 3G" throttling, click reload 3 times, then observe the cancelled requests. Switch back to "No throttling" when done.

### Part 3: concatMap -- Update Order Status with Optimistic Updates (10 min)

**Editor:** Show `orders.store.ts`, lines 117-150.

1. **Line 117:** `updateOrderStatus: rxMethod<{ id: number; status: OrderStatus }>(`
   > "This rxMethod takes an object with `id` and `status`. Each call pushes one object into the pipeline."

2. **Lines 123-125 -- the optimistic update (inside `tap`):**
   ```typescript
   tap(({ id, status }) => {
     patchState(store, updateEntity({ id, changes: { status } }));
   }),
   ```
   > "THIS is the optimistic update. We update the entity BEFORE the API call. The card moves to the new kanban column INSTANTLY. The user sees zero delay. The API call happens in the background."

3. **Lines 131-149 -- concatMap:**
   ```typescript
   concatMap(({ id, status }) =>
     ordersApi.updateStatus(id, status).pipe(
       tapResponse({
         next: () => {
           injector.get(StoreCoordinator).onOrderStatusChange(id, status);
         },
         error: (err: Error) => {
           patchState(store, {
             error: `Failed to update order ${id}: ${err.message}`,
           });
         },
       })
     )
   )
   ```
   > "concatMap queues requests. If you drag order A to 'Shipped' and then order B to 'Delivered', concatMap ensures A's API call finishes before B's starts. This prevents race conditions where the server processes requests out of order."

4. **Show the API delay.** Open `src/app/features/orders/services/orders-api.service.ts`, lines 26-29:
   ```typescript
   updateStatus(id: number, status: OrderStatus): Observable<Cart> {
     return this.api.put<Cart>(`/carts/${id}`, { status }).pipe(
       delay(800),
     );
   }
   ```
   > "There is an intentional 800ms delay so you can observe the async behavior. In a real app, network latency would provide the delay naturally."

5. **Show the drag-and-drop handler.** Open `src/app/features/orders/components/orders-kanban.component.ts`, lines 401-410:
   ```typescript
   onDrop(event: CdkDragDrop<OrderStatus>) {
     if (event.previousContainer === event.container) {
       return;
     }
     const order = event.item.data as Order;
     const newStatus = event.container.data;
     this.store.updateOrderStatus({ id: order.id, status: newStatus });
   }
   ```
   > "The CDK DragDrop event gives us the order (from `cdkDragData`) and the target column's status (from `cdkDropListData`). One line to the store, and the optimistic update plus API call happen automatically."

**WOW MOMENT -- Browser demo (TESTABLE):**
1. Make sure Network tab is visible
2. Pick an order card from the "New" column
3. Drag it to the "Shipped" column
4. Watch: the card moves INSTANTLY (optimistic update), then 800ms later the PUT request completes in the Network tab
5. Now drag two cards quickly in succession (within 1 second)
6. Watch the Network tab: the second PUT request starts AFTER the first one completes (concatMap queueing)

> "The user sees instant feedback. The API calls happen sequentially in the background. If one fails, we show an error via the snackbar. This is the optimistic update pattern."

6. **Show the error effect.** Open `orders-kanban.component.ts`, lines 376-383:
   ```typescript
   effect(() => {
     const error = this.store.error();
     if (error) {
       this.snackBar.open(error, 'Dismiss', { duration: 5000 });
       this.store.clearError();
     }
   });
   ```
   > "This effect watches the error signal. When the store sets an error (from a failed API call), the effect fires and shows a snackbar. It then clears the error so the effect does not fire again for the same message."

### Part 4: exhaustMap -- Delete Order (5 min)

**Editor:** Show `orders.store.ts`, lines 160-173.

```typescript
deleteOrder: rxMethod<number>(
  pipe(
    exhaustMap((id) =>
      ordersApi.deleteOrder(id).pipe(
        tapResponse({
          next: () => patchState(store, removeEntity(id)),
          error: (err: Error) => {
            patchState(store, { error: err.message });
          },
        })
      )
    )
  )
),
```

1. > "exhaustMap ignores new emissions while the current inner Observable is still active. If the user clicks delete and then somehow clicks it again before the API responds, the second click is silently dropped."

2. **Contrast with the other operators:**
   - switchMap would cancel the first delete and start a new one -- but the first might have already reached the server
   - concatMap would queue both deletes -- but the second would fail because the entity is already gone
   - exhaustMap is the right choice: "I am already deleting this, ignore the duplicate"

3. **Show the card's delete trigger.** Open `src/app/features/orders/components/order-card.component.ts`, line 182:
   ```typescript
   <button mat-menu-item (click)="delete.emit(order().id)" class="delete-action">
   ```
   And the parent binding in `orders-kanban.component.ts`, line 345:
   ```typescript
   (delete)="store.deleteOrder($event)"
   ```

**Browser demo (TESTABLE):**
1. Pick any order card
2. Click the three-dot menu (more_vert icon) on the card
3. Click "Delete Order"
4. Watch: the card disappears, the column count decrements, the stats update
5. Total Orders in the stats row decreases by 1

### Part 5: The Smart/Dumb Component Pattern (5 min)

**Editor:** Show the component architecture.

1. **Smart (container) component:** `orders-kanban.component.ts`
   - Line 360: `protected readonly store = inject(OrdersStore);`
   - Injects the store directly
   - Handles drag-drop events, wires store methods to child outputs
   - Has no business logic of its own

2. **Dumb (presentational) component:** `order-card.component.ts`
   - Line 202: `order = input.required<Order>();` -- signal-based input
   - Line 206: `statusChange = output<{ id: number; status: OrderStatus }>();`
   - Line 207: `delete = output<number>();`
   - No store injection, no service injection
   - Just receives data and emits events

3. **Show the wiring in the kanban template (lines 341-346):**
   ```html
   <app-order-card
     [order]="order"
     (statusChange)="store.updateOrderStatus($event)"
     (delete)="store.deleteOrder($event)"
   />
   ```
   > "The dumb component does not know that `updateOrderStatus` uses concatMap with optimistic updates, or that `deleteOrder` uses exhaustMap. It just emits events. The smart component connects the dots."

### Part 6: withHooks -- Automatic Initialization (2 min)

**Editor:** Show `orders.store.ts`, lines 187-191.

```typescript
withHooks({
  onInit(store) {
    store.loadOrders();
  },
}),
```

> "Same pattern as the Inventory store. When the first component injects `OrdersStore`, `onInit` fires and triggers `loadOrders()`. The kanban board populates automatically."

**Browser demo:**
- Navigate away from /orders (click "Inventory" in the sidebar)
- Navigate back to /orders
- The board loads with fresh data (new random statuses assigned)
- Watch Network tab: one GET request to `/carts`

---

## Audience Interaction Points

- **After Part 1:** "Quick quiz. You have a search box that fires an API call on each keystroke. Which operator? ...switchMap. You have a 'Submit Order' button. Which operator? ...exhaustMap. You have a batch update that processes items one by one. Which operator? ...concatMap."
- **After Part 3:** "What is the risk of optimistic updates?" (Answer: if the API fails, the UI is in a state that does not match the server. You need rollback logic or a reload.)
- **After Part 4:** "When would exhaustMap be the WRONG choice?" (Answer: if the user clicks delete on order A, then delete on order B while A is still in-flight, B would be silently dropped. exhaustMap is best when the same operation is triggered multiple times, not different operations.)

---

## Common Questions & Answers

**Q: Can I pass a Signal directly to rxMethod?**
A: Yes. `rxMethod<string>` can accept a string Signal. When the signal value changes, the rxMethod pipeline re-triggers automatically. This is useful for reactive triggers like `store.loadProducts(store.filters)` where filters changing automatically reloads data.

**Q: What happens if I use switchMap for a delete operation?**
A: If the user somehow triggers delete twice, switchMap would cancel the first and start the second. But the first might have already reached the server and deleted the entity. Now you have a second delete call for an already-deleted entity, which would likely return a 404. Use exhaustMap for destructive operations.

**Q: Why not just disable the button during loading?**
A: You should do both. Disabling the button is a UI-level guard. exhaustMap is a data-level guard. Defense in depth. The button might re-enable due to a bug, or the user might trigger the action from a keyboard shortcut, or a programmatic caller might not respect the UI state.

**Q: How does tapResponse differ from catchError?**
A: `catchError` in a `switchMap`/`concatMap` inner Observable is fine for handling one error. But if you forget to re-emit or complete correctly, the outer Observable can die. `tapResponse` is a convenience wrapper that always handles errors safely and keeps the outer stream alive. It is specifically designed for the `rxMethod` + `patchState` pattern.

**Q: Where does the 800ms delay come from?**
A: It is an artificial delay added in `src/app/features/orders/services/orders-api.service.ts` line 28 via the RxJS `delay(800)` operator. It simulates realistic network latency so you can observe the optimistic update timing. In production, you would remove this.

**Q: Can I mix async/await and rxMethod in the same store?**
A: Absolutely. The Inventory store does exactly this: `loadProducts` is an rxMethod (line 192), while `addProduct`, `updateProduct`, and `deleteProduct` are all async/await (lines 244, 269, 291). Use rxMethod when you need flow control. Use async/await when you do not.

---

## Recovery Steps

**If the kanban board is empty:**
1. Check Network tab for a failed GET to `/carts`
2. DummyJSON may be rate-limiting -- wait 30 seconds and click "Reload"
3. Check console for errors

**If drag-and-drop does not work:**
1. Verify CDK imports in `orders-kanban.component.ts` (lines 3-7: `CdkDragDrop`, `CdkDrag`, `CdkDropList`)
2. Check that `cdkDropList` and `cdkDrag` directives are in the template (lines 333, 341)
3. Make sure you are dragging from one column to a DIFFERENT column (same-column drops are intentionally ignored, line 402)

**If optimistic update is not visible (card jumps after delay):**
1. The `tap` on line 123 should fire before the API call. Add `console.log('optimistic', id, status)` inside the tap to verify
2. If the card only moves after the API response, the `tap` may have been accidentally placed inside the `concatMap` instead of before it

**If the switchMap cancellation demo does not show cancelled requests:**
1. Enable "Slow 3G" network throttling in DevTools
2. Click "Reload" 3-4 times rapidly
3. Look for "(canceled)" in the Status column of the Network tab
4. Switch back to "No throttling" after the demo

---

## Transition to Next Section

> "We have now covered the three async strategies that handle 90% of real-world scenarios: switchMap for 'latest wins', concatMap for 'queue in order', and exhaustMap for 'ignore while busy'. Combined with optimistic updates, these patterns make the UI feel instant while keeping data integrity. In the next section, we will look at how stores can talk to each other through coordination patterns."

---

## Section Cheat Sheet

| Concept | Location | Line(s) |
|---|---|---|
| rxMethod vs async/await comment | `orders.store.ts` | 23-29 |
| `withEntities<Order>()` | `orders.store.ts` | 42 |
| `ordersByStatus` computed | `orders.store.ts` | 47-55 |
| `totalOrders` computed | `orders.store.ts` | 57 |
| `totalRevenue` computed | `orders.store.ts` | 59-61 |
| `loadOrders` -- switchMap | `orders.store.ts` | 75-108 |
| `tapResponse` error handling | `orders.store.ts` | 86-105 |
| `updateOrderStatus` -- concatMap | `orders.store.ts` | 117-150 |
| Optimistic update (tap before concatMap) | `orders.store.ts` | 123-125 |
| Rollback on error | `orders.store.ts` | 138-144 |
| `deleteOrder` -- exhaustMap | `orders.store.ts` | 160-173 |
| `withHooks` onInit | `orders.store.ts` | 187-191 |
| Store injection | `orders-kanban.component.ts` | 360 |
| CDK DragDrop handler | `orders-kanban.component.ts` | 401-410 |
| Error effect with snackbar | `orders-kanban.component.ts` | 376-383 |
| Operator explainer panel | `orders-kanban.component.ts` | 270-307 |
| Signal-based input | `order-card.component.ts` | 202 |
| Output events | `order-card.component.ts` | 206-207 |
| API delay (800ms) | `orders-api.service.ts` | 27-29 |
| Order model with status | `order.model.ts` | 7-20 |
