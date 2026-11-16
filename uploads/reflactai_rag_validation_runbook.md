# ReflactAi RAG Validation Runbook

**Document type:** Synthetic test runbook\
**Version:** 1.0\
**Purpose:** Validate document ingestion, retrieval, and grounded
answers in the ReflactAi Self-RAG application.

> IMPORTANT: This is fictional test data created only to test RAG
> retrieval. The thresholds, service names, and procedures below are not
> production instructions.

## 1. Payments API high-CPU incident

### Trigger condition

Treat this as a high-CPU investigation when the `payments-api` service
CPU utilization is **above 85% for 10 consecutive minutes**.

### Initial checks

1.  Confirm the affected service is `payments-api`.
2.  Check CPU utilization over the previous 15 minutes.
3.  Compare the current value with the 85% threshold.
4.  Check whether a deployment or configuration change occurred in the
    previous 30 minutes.
5.  Review application logs for repeated errors or unusually high
    request volume.

### Escalation

Escalate to the on-call platform engineer if CPU remains above 85% for
10 consecutive minutes after the initial checks. Include the service
name, observed CPU value, duration, recent deployment details, and
relevant log timestamps.

### Safety note

Do not restart production workloads solely because CPU is high. First
collect the diagnostic evidence and obtain the required incident
approval.

## 2. Kubernetes CrashLoopBackOff

### Required checks

When a Kubernetes pod repeatedly restarts and enters `CrashLoopBackOff`,
collect the following evidence:

1.  Pod status and restart count using `kubectl get pods`.
2.  Pod events and container details using
    `kubectl describe pod <pod-name>`.
3.  Logs from the current container using
    `kubectl logs <pod-name> -c <container-name>`.
4.  Logs from the previous crashed container using
    `kubectl logs <pod-name> -c <container-name> --previous`.
5.  Container exit code and termination reason.
6.  Recent changes to image, environment variables, secrets, config
    maps, probes, and resource limits.

### Exit-code clues

-   Exit code `137` can indicate that the container was killed, commonly
    due to an out-of-memory event.
-   Exit code `1` generally indicates that the application process
    exited with an error.
-   Exit code `0` indicates that the process exited successfully, which
    may still be unexpected for a long-running service.

### Next action

Do not delete or restart the pod before collecting its description,
events, and previous-container logs. Share the evidence with the service
owner before making a production change.

## 3. Synthetic service-specific facts for retrieval tests

  Field                                         Test value
  --------------------------------------------- ---------------------------
  Service name                                  `payments-api`
  High-CPU threshold                            Above 85%
  Required duration                             10 consecutive minutes
  CPU review window                             Previous 15 minutes
  Deployment correlation window                 Previous 30 minutes
  Escalation owner                              On-call platform engineer
  Kubernetes restart state                      `CrashLoopBackOff`
  Exit code associated with possible OOM kill   `137`

## 4. RAG validation questions

Ask these questions after uploading and indexing this document:

1.  What CPU threshold triggers a high-CPU investigation for
    `payments-api`?
2.  How long must CPU remain above the threshold before escalation?
3.  What time window should be reviewed for CPU utilization?
4.  What deployment window should be checked for recent changes?
5.  Which team member should receive the escalation?
6.  Which command retrieves logs from the previous crashed container?
7.  What evidence must be collected before restarting or deleting a pod?
8.  What can exit code `137` indicate?
9.  Is it safe to restart a production workload solely because CPU is
    high?

## 5. Expected-answer checks

A grounded answer should identify: - The CPU trigger as **above 85% for
10 consecutive minutes**. - The CPU review window as **15 minutes**. -
The deployment correlation window as **30 minutes**. - The escalation
owner as the **on-call platform engineer**. - The previous-container log
command as `kubectl logs <pod-name> -c <container-name> --previous`. -
Exit code `137` as a possible indication of an OOM-related kill. - The
requirement to collect diagnostic evidence before restarting or deleting
a pod.

If the assistant cannot find an answer in this document, it should say
that the uploaded runbook does not specify it rather than inventing a
value.
