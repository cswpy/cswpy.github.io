---
pubDatetime: 2024-01-11T18:53:00Z
title: Paper Review | Design of Practical Systems for Fault-Tolerant VMs
slug: design-practical-systems-for-fault-tolerant-vms
featured: false
draft: false
tags:
  - critique
  - systems
description: This is my review/summary of this famous paper on fault-tolerance using the state-machine approach.
---

# Design of Practical System for Fault-Tolerant VMs

[Paper Link](https://pdos.csail.mit.edu/6.824/papers/vm-ft.pdf)

This is my review/summary of this famous paper on fault-tolerance using the state-machine approach.

---

Shipping all changes to primary machine to backup consumes enormous bandwidth

Instead, model servers as deterministic state-machines that are kept in sync by starting them in the same initial states and give the identical inputs in the same order. Extra coordination is required for non-deterministic input.

Using VM to implement synchronized state-machines is easier
Hypervisor is able to capture all information about non-deterministic operations on primary VM and replay them on backup VM

## Design

To provide fault-tolerance to a primary VM, we run a backup VM in a different physical server that is kept in sync and executes identically to the primary VM. The two VMs are in _virtual lockstep_. Only the primary VM advertises its presence to the network, hence all inputs goes to the primary VM. All the inputs received by the primary VM is sent to the backup VM through _logging channel_. The outputs of the backup VM is dropped by the hypervisor. The primary and backup VMs follow a protocol where the backup acknowledges information from the primary.

### Challenges

1. correctly capturing all the input and non-determinism to ensure deterministic execution in the backup VM
2. correctly applying the inputs and non-determinism to the backup VM
3. does not degrade performance

### Deterministic Replay Implementation

Deterministic replay records the inputs of a VM and all possible non-determinism associated with the VM execution in a stream of log entries written to a log file. The VM execution may be exactly replayed later by reading the log entries from the file.
For non-deterministic operations, sufficient information is logged to allow the operation to be reproduced with the same state change and output. For non-deterministic events such as timer or IO completion interrupts, the exact instruction at which the event occurred is also recorded. During replay, the event is delivered at the same point in the instruction stream.

### Fault Tolerance Protocol

**Output requirement**: if the backup VM ever takes over after a failure of the primary, the backup VM will continue executing in a way that is entirely consistent with all outputs that the primary VM has sent to the external world.

**Output Rule**: the primary VM may not send an output to the external world, until the backup VM has received and acknowledged the log entry associated with the operation producing the output.

### Detecting & Responding to Failure

- Backup fails
  - Primary _go live_, leave recording mode (stop sending log entries over the logging channel), and start executing normally
- Primary fails
  - Backup _go live_, replays all log entries, then start executing as a normal VM
  - New MAC address broadcasted to network
- Detecting failure
  - UDP heartbeating between servers that are running VMs to detect server failures
  - Halt in the flow of logging channel or acknowledgements after specified timeouts
- Split-brain problem: network connectivity between primary and backup severed; two primary running at the same time
  - When either primary or backup VM wants to go live, it executes an atomic test-and-set operation on shared storage
    - Succeed → take over
    - Fails → the other VM is already live → halts itself (commits suicide)
    - Failed to read storage → wait

## Practical Implementation of Fault Tolerance

### Cloning & Re-booting

FT VMotion clones the source VM to a remote host, set up a logging channel, and causes the source VM to enter logging mode as primary, and the destination VM to enter replay mode

vSphere implements a clustering service that maintains management and resource information. When failure happens, the primary informs the clustering service to request a new backup. The clustering service determines the best server on which to run the backup VM based on resource usage and invokes FT VMotion to create the backup VM.

### Logging Channel

Primary VM writes to the log buffer as it executes. The contents in primary’s log buffer are flushed out to the logging channel ASAP. Log entries are read into backup’s buffer from the logging channel ASAP. The backup sends acknowledgements back to the primary each time it reads some log entries from the network into its log buffer.

Primary encounters full log buffer → stops execution until log buffer is flushed out
Backup encounters empty log buffer → stops execution

**Slowdown Mechanism**: send additional info to determine real-time execution lag between the primary and backup VMs. If the execution lag is significant, VMware FT informs the scheduler to give it smaller amount of CPU.

**Races**: since the primary and backup shares virtual storage and external devices could write into the storage, we need to make sure that no race occurs when a DMA (Direct Memory Access) happens while a read from primary/backup takes place

_bounce buffer_: temporary buffer that has the same size as the memory being accessed by a disk operation. Memory reads/writes from/to the bounce buffer instead of the disk. Hypervisor only interrupts VM after the copy is complete.

#### Network IO

Disabling of the asynchronous network optimizations → all network input/output are trapped to hypervisor

1. Clustering optimization to reduce VM traps and interrupts
2. Reducing the transmit delay of sending a log message to the backup and getting an acknowledgement
