---
author: Pengyu Wang
pubDatetime: 2024-02-04T14:03:22.000Z
modDatetime:
title: What Every Programmer Should Know About Memory
featured: false
draft: false
tags:
  - architecture
  - memory
description: notes on the document on memory
---

# What Every Programmer Should Know About Memory

[Document link](https://people.freebsd.org/~lstewart/articles/cpumemory.pdf)

## Today's Hardware

**Northbridge**: connecting CPUs, and CPU to RAM
**Southbridge**: connects to northbridge, PCIe, SATA, and USB

> [!info] How they communicate
> Communication between CPUs & RAM goes over the same bus
> RAM typically only has one port
> Communication with I/O goes through northbridge

### Bottlenecks

- All communication pass through the CPU → **Direct Memory Access (DMA)**
  - DMA requests contends with RAM access
- Single-port RAM access through Northbridge → more buses to RAM (e.g. DDR3)
  - bandwidth is in high contention

#### How to increase memory bandwidth

- Northbridge could be connected to external memory controllers
  - more bandwidth; support more memory
- integrate memory controllers into CPUs and attach memory to each CPU
  - less burden on Northbridge
  - memory becomes **Non-Uniform Memory Architecture (NUMA)**
    - access memory attached to other CPUs through interconnects
    - _NUMA Factor_: extra time needed to access remote memory

## RAM Types

### Static RAM (SRAM)

One cell require 6 transistors - 2 for each inverter, 2 inverters - 2 additional for overwriting values inside - **Word Line**: controls the access transistors; high/1 → read on bitline - **Bit Line**: read data from/ write data to bitline
Require constant power, but the cell state is stable, no need to refresh

### Dynamic RAM (DRAM)

One cell require 1 transistor & 1 capacitor
State is kept in capacitor, when **Access Line** is raised, charge goes to Bit Line.

**Leakage**: takes a short time for the capacity to dissipate - DRAM must be refreshed periodically - info not directly usable, must read through a sense amplifier - reading depletes the charge → loop the output of sense amplifier back into the capacitor → costs extra energy & time - charging & draining capacitor takes time

Though with many flaws, DRAM is much cheaper to make and require less power.

### Accessing DRAM

If we were to **use a wire for each bit in a 4GB memory** → $2^{32}$ address lines
Instead, we encode the address in binary → 32 address lines = $2^{32}$ locations
Require large chip area and big multiplexer

**Arrange the DRAM cells in grid layout**: 4GB → 65536 rows and columns
Use row/column address selection → 16 row select lines and 16 column select lines
Still not scalable → memory controller needs to have (16+16) \* 8 = 256 for 8 RAM modules

**Multiplexing the address itself**

> [!question] Are we transmitting the RAS and CAS over the same set of wires? Does this cut the wires by half?
> A: Yes, we lower the $\overline{RAS}$ signal and transmit RAS first, and after $t_{RCD}$ ($\overline{RAS}$-to-$\overline{CAS}$ delay) time, we lower the $\overline{CAS}$ line and transmit CAS. Both RAS and CAS are active-low because it’s more resistant to false-triggering due to noise. Finally, we wait for $\overline{CAS}$ Latency (CL) before data becomes available.

![[images/Pasted image 20240203004238.png]]

![[images/Pasted image 20240204105246.png]]

#### Terms

$t_{RCD}$: the delay between the transmission of RAS and CAS signal
CL: CAS-latency - the delay to get the data after CAS is issued
Command Rate: how often the memory controller can issue commands (usually 1/2 commands per cycle)
$t_{RP}$: Row precharge time (purple), the time after lowering RAS & WE and before RAS signal is sent; can overlap with memory transfer time (blue), but 1 cycle more
$t_{RAS}$: the time after a RAS signal and before a precharge command

#### Precharge

lowering RAS and WE (write-enable) line simultaneously

Require additional wire to indicate RAS vs CAS, but overall reduced the number of wires

#### Sequence of events

1. Raise $\overline{RAS}$ signal, transfer row address on address lines
2. Wait for $t_{RCD}$ time, raise $\overline{CAS}$ signal, and transfer row address on address lines
3. Wait for CL (CAS-Latency) time, start receiving data
4. Wait for the maximum between data transfer time (depending on DDR version, hardware), and $t_{RP}$ (precharge time)
5. We could then keep row open and send new CAS signal to get consecutive memory addresses; otherwise, we check if we waited long enough in Step 1-4 for $t_{RAS}$ to pass, wait for it to pass if not, and back to Step 1

Using Figure 2.9, suppose we have a DDR module with 2-3-2-8-T1 spec (i.e $CL=2$, $t_{RCD}=3$, $t_{RP}=3$, $t_{RAS}=8$, command rate=1), we have Step 1 - 4 = 8 cycles, which means RAS line has also completed precharge.

#### Recharge

Memory cells have to be refreshed every 64 ms, which could stall memory access.

### Memory Types

- SDR: Single Data Rate
  - DRAM cell array throughput = memory bus throughput
- DDR1: Double Data Rate
  - transports data on the rising and falling edge
  - introduced I/O buffer → 2-line data bus
- DDR2
  - I/O buffer doubles the frequency → 4-line data bus
- DDR3
  - 8-line data bus

### Takeaways

- SRAM expensive but fast; DRAM cheap but slow
- Memory cells need to be individually selected
- number of address lines → cost of memory controller & DRAM chip
- DRAM takes time to read/write
