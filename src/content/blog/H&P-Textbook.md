---
author: Pengyu Wang
pubDatetime: 2024-03-13T00:41:00.000Z
modDatetime:
title: Reading Notes | Computer Architecture
featured: true
draft: false
tags:
  - architecture
  - memory
  - notes
  - cpu
description: reading notes on the book Computer Architecture
---

# Computer Architecture: A Quantitative Approach

This is my notes on the book _Computer Architecture: A Quantitative Approach_ by John Hennessy and David Patterson. I am reading it _out-of-order_ thought the notes will be committed _in-order_. (forgive my lame joke)

## Chapter 5 Memory Hierarchy Design

### Intro

The gap between processor and memory performance grew increasingly large → motivates memory hierarchy so that quicker but smaller caches act as intermediaries

**Set Associative**: a memory block is mapped onto a set, and then the block can be placed anywhere within that set.
_n-way set associative_: n blocks in a set
_direct-mapped cache_: one block per set (n=1)
_fully-associative cache_: one set (n=# of slots in cache)

![](/images/virtual-address-usage.png)

### Advanced Optimizations of Cache Performance

#### Hardware Prefetching

Since memory is a hierarchy, often times the instruction or data we needed are not in L1 caches – they may reside in lower caches or even main memory. When we do not care about performance and wait for an instruction and data to be fetched exactly when it’s needed, this is called **demand-fetch**. To optimize performance, we prefetch data/instruction into caches.

Instruction prefetch is frequently done in hardware. On a miss, processor fetches the requested block as well as the next consecutive block. Requested block is put into the instruction cache, the prefetched block is put into **instruction stream buffer**.

Prefetching and branch prediction are both speculation. But prefetching does not impact correctness, it improves performance (by improving cache hit rate), whereas wrong branch prediction lead to incorrect program.

#### Software Prefetching (Compiler-Controlled)

Two ways of software prefetching

- Register prefetch (_hoisting/binding_): load the prefetched value into a register
  - may prevent instructions from committing
- Cache prefetch: loads the data into cache - require ISA support - may get evicted from cache before demand → futile work
  Either of the two ways can be _faulting_ or _nonfaulting_. _Faulting_ means that the instruction could incur virtual address checks, access right

## Appendix - Pipelining

Three classes of instructions

1. ALU instructions - take 2 registers or 1 register and a sign-extended immediate, calculate them, and store them into a third register
2. Load & Store - calculate the _effective address_ from the _base register_ and the _offset_
3. Branches and jumps - Comparisons between a pair of registers or between a register and zero

### Five Stages of Pipeline

1. Instruction Fetch Cycle (IF)
   1. Fetch the current instruction (stored in PC) from memory, increment the PC by adding 4 bytes (length of a instruction) to PC
2. Instruction decode/register fetch cycle (ID)
   1. decode the instruction and read the source registers from register file
   2. _fixed-field decoding_: decoding is done in parallel with reading registers
3. Execution/effective address cycle (EX)
   1. Depending on the instruction type, ALU performs one of the following
      1. _Memory reference_: adds the base register and the offset → effective address
      2. _Register-Register instruction_: perform operation (specified opcode) on the values
      3. _Register-Immediate instruction_: perform operation (specified opcode) on the value and the sign-extended immediate
4. Memory access (MEM)
   1. read from/write to the memory depending on load/store instruction
5. Writeback cycle (WB)
   1. write the result into the register file, whether it comes from the memory (`load`) or from the ALU (ALU instruction)

### From sequential to pipelining

![](/images/pipeline-sequential.png)

We could overlap different instructions to speedup the CPU execution. There are a few observations

1. Separate instruction and data caches so that I-Cache and D-Cache can be accessed by different instructions at their decode (ID) and memory (MEM) pipe-stages respectively. This is why L1 cache usually have separate instruction and data caches.
2. Two reads and one write to register file per cycle: two register reads in decode (ID) stage and one write in writeback (WB) stage. To handle read & write to the same register, register write in the first half of the clock cycle and the read in the second half.
3. Need to update PC in decode (ID) stage, but might need to jump because of a branch being handled at decode (ID) stage.

**Pipeline registers** to ensure isolation between different instructions: they save the results of a stage and used as the input for the next stage.

#### Issues with pipelining

- imbalance among the pipe stages
  - clock can run no faster than the slowest pipeline stage
- pipeline overhead
  - pipeline register delay: setup time; propagation delay
  - clock skew: maximum delay between the clock arrives at any two registers

#### Pipeline Hazards

1. _Structural hazards_: hardware unable to support all combination of instructions
2. _Data hazards_: data dependencies
3. _Control Hazards_: branches

To handle these hazards, we need to **stall** the pipeline, i.e. delaying all other instructions in the pipeline except for the one

##### Structural Hazards

When some of the resources cannot support the needs of pipelined instructions

e.g. single-memory pipeline → decode and memory stage both reads from the memory

**pipeline bubble**: stall the pipeline for 1 clock cycle

Provide separate memory access for instructions, by splitting the cache into instruction cache and data caches, or by using _instruction buffers_ to hold instructions

##### Data Hazards

When the instructions have data dependencies and pipeline changes the order of read/write accesses

###### Forwarding (bypassing)

1. ALU result from both the EX/MEM and MEM/WB pipeline registers is fed back to the ALU inputs
2. If the forwarding hardware detects the previous ALU operation has written source register for the current ALU operation, control signals selects the forwarded as the ALU input

Forwarding sends the data from the output of any functional unit to another

![](/images/pipeline-bypass.png)

However, not all data hazards can be handled by bypassing
e.g. a memory (LD) operation followed by a ALU operation (DSUB) that requires the LD result.
The LD operation have the data ready at the end the MEM stage (end of CC4), whereas the DSUB requires it in EX stage (beginning of CC4).
In this case, we introduce _pipeline interlock_, to preserve the correct execution pattern by adding bubbles.

##### Branch Hazards

When a branch is executed, it may or may not increment the PC by 4. A branch instruction that gets _taken_ normally change the PC at the end of ID (decode) stage.

###### Reducing Pipeline Branch Penalties

Suppose we have a branch instruction $i$. If the branch is not taken, we execute the next instruction $i+1, i+2$ and so on. If the branch is taken, we jump to branch target $j$ and execute $j, j+1$ and so on.

1. _freeze_ or _flush_ the pipeline: fetch the instruction again **only after** the decode (ID) stage of branch instruction → causes a 1-cycle stall. First fetch (IF) is essentially a stall.
2. _predicted-not-taken_ or _predicted-untaken_: always presume the branch is not taken and fetch the instruction $i+1$. If the prediction is wrong, then change the later stages (ID, EX, MEM, WB) to `no-op` and fetch the branch target instruction $j$.
   1. _predicted-taken_ does not work in MIPS since branch target is not known until after the decode (ID) stage; other processors might be able to predict taken.
3. _delayed branch_: execute instruction $i+1$ (the sequential successor) in the _branch delay slot_. Then after the instruction $i$ is done with decode stage (CC3), we execute instruction $i+2$ if the branch is not taken and execute branch target $j$ if the branch is taken.
   1. We could fill the _branch delay slot_ with an instruction from before in scenario (a). This is the ideal situation
   2. We could fetch the _predicted-taken_ instruction $j$ in scenario (b), if wrong, the instruction in the _branch delay slot_ is turned into a no-op.
   3. We could fetch the _predicted-untaken_ instruction $i+1$ in scenario (c), if wrong, the instruction is turned into a no-op

![](branch-delay.png)

#### Pipeline Implementation

1. Instruction fetch cycle (IF)
   1. Instruction Register (IR) holds the instruction that’s being executed, fetched from memory using address stored in PC, i.e. `IR <- Mem[PC]`
   2. NPC holds the address of the next sequential instruction, i.e. `NPC <- PC+4`
2. Instruction decode/register fetch cycle (ID)
   1. Read register file and store them into two temp registers
      1. `A <- Regs[rs]`
      2. `B <- Regs[rt]`
   2. Read the lower 16 bits of IR and sign extend it to store in the the temp reg
      1. `Imm <- IR[15:0]`
3. Execution/effective address cycle (EX)
   1. Memory reference: form the effective address
      1. `ALUOutput <- A + Imm`
   2. Reg-Reg ALU instruction: performs the operation specified by the function code
      1. `ALUOutput <- A func B`
   3. Reg-Imm ALU instruction: performs the operation specified by the opcode
      1. `ALUOutput <- A op Imm`
   4. Branch: ALU adds the NPC to the sign-extended immediate to compute the branch target address
      1. `ALUOutput <- NPC + (IMM << 2)`: shifted left by 2 bits to create a word offset
      2. `Cond <- (A == 0)`: comparison against 0 for `BEQZ`
4. Memory access/branch completion cycle (MEM)
   1. `PC <- NPC`
   2. Memory reference: load/store based on the address computed by ALU in prior cycle
      1. `LMD <- Mem[ALUOutput]`: load into LMD (load memory data) register
      2. `Mem[ALUOutput] <- B`: store B register into the address
5. Write-back cycle (WB)
   1. Write back into the register file
   2. Reg-Reg ALU
      1. `Regs[rd] <- ALUOutput`
   3. Reg-Imm ALU
      1. `Regs[rt] <- ALUOutput`
   4. Load instruction
      1. `Regs[rt] <- LMD`
