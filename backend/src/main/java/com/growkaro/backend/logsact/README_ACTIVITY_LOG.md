# Activity Log — setup notes

## 1. Enable scheduling (required for the heartbeat)

Add to your main application class:

```java
@SpringBootApplication
@EnableScheduling
public class YourApplication { ... }
```

Without this, `ActivityLogBroadcaster.heartbeat()` never runs, and idle
connections may get silently dropped by proxies/load balancers — which
looks like unexplained reconnects on the frontend.

## 2. Implement AdminTokenValidator

Create one class in your project that wires `AdminTokenValidator` to your
existing JWT logic (see the Javadoc example in `AdminTokenValidator.java`).

## 3. Call the service where actions happen

```java
@Service
public class WithdrawalService {

    private final ActivityLogService activityLogService;

    public Withdrawal requestWithdrawal(User user, BigDecimal amount) {
        Withdrawal w = new Withdrawal();
        w.setUserId(user.getId());
        w.setAmount(amount);
        w.setStatus(WithdrawalStatus.PENDING);
        w = withdrawalRepo.save(w);

        activityLogService.log(
            user.getId(), user.getName(), user.getRole().name(),
            ActivityType.WITHDRAWAL_REQUESTED,
            user.getName() + " requested withdrawal of ₹" + amount,
            "WITHDRAWAL", w.getId(),
            Map.of("amount", amount, "status", "PENDING")
        );

        return w;
    }
}
```

## 4. Reverse proxy (Nginx) — disable buffering for the stream route

```nginx
location /api/admin/activity-logs/stream {
    proxy_pass http://backend;
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 3600s;
    proxy_set_header Connection '';
    chunked_transfer_encoding off;
}
```

Without `proxy_buffering off`, Nginx can buffer SSE events instead of
streaming them immediately, and may also close/reopen the connection —
another common cause of the "many requests" symptom.

## 5. Frontend

Handle the extra event names now sent by the broadcaster:
- `connected` — sent once right after subscribe, flip status badge to "live"
- `heartbeat` — sent every 25s, ignore the payload, just proves the
  connection is alive (useful to reset a "last seen" timestamp if you want
  to detect a truly dead connection and force a manual reconnect)
- `activity` — the actual log entries (unchanged from before)

## 6. Scaling beyond one instance

`ActivityLogBroadcaster` keeps emitters in local memory. If you run more
than one backend instance behind a load balancer, an admin connected to
instance A won't see events triggered on instance B. At that point, swap
`broadcast()` to publish to Redis Pub/Sub (or Kafka) instead, with every
instance subscribing and forwarding to its own local emitters.
