---
pubDatetime: 2024-01-11T18:56:00Z
title: Paper Review | Scalable Computation of High-Order Optimization Queries
slug: scalable-computation-of-high-order-optimization-queries
featured: false
draft: false
tags:
  - critique
  - database
description: This is my review of the paper on using ILP solvers for database Package Queries. This paper is a cornerstone of my capstone thesis under the supervision of Prof. Azza Abouzied.
---

# Scalable Computation of High-Order Optimization Queries

[Paper link](https://dl.acm.org/doi/10.1145/3299881)

## Overview with simple words

The paper proposes a solution for finding a set of tuples that collectively satisfy certain group constraints. The set of tuples could be filtered initially using the traditional DBMS predicates. The group constraints limits the aggregate value of a group of tuples. It finds the solution by turning the question into an optimization problem and solved by a black-box solver. Additionally, the paper simplifies the optimization problem by finding out a few representative tuples of the base relation, and first construct a solution based on them. It then iteratively substitute the representative tuples by the real tuples in a smaller optimization problem.

## Details

### Construction of a package query

1. Basic package query: select relevant attributes from the desired relation
2. Repetition constraints: limits the number of times one tuple appears in the package
3. Predicates
   1. Base predicates: individual predicate on each tuple, filtered by the DBMS
   2. Global predicates: constraints on the group of tuples, solved by ILP solver
4. Objective Clause: ranking of packages, either _minimize_ or _maximize_

### Query→ILP using Direct

Each tuple in the base relation is assigned a variable $x_i$, that indicates the number of times it could appear in the package. $x_i=0$ for tuples that does not satisfy the base predicates. It then expresses the global predicates as inequalities. Finally, we minimize/maximize the objective clause under the previous constraints.

### SketchRefine

Direct is too slow and is not scalable, also, the optimization problem is hard to solve, need to decompose into smaller problems.

- **SketchRefine**
  - Offline partitioning
    - Partition the base relation into groups, and find the representative tuple for each group
    - $\tau$ restricts the group size; larger $\tau$ → larger group size → less groups
    - $d_{ij}$ defines the greatest distance between any two tuples in a group $G_i$ on attribute $j$; smaller $d_{ij}$ → better approximation
    - Partitioning dataset on the union of all attributes
  - Sketch
    - Solve a Sketch Query where the base relation is the group of representative tuples generated in offline partitioning
    - Produces the sketch package
  - Refine
    - Refine the sketch package one group at a time
    - Eliminate the representative tuple from one group
    - Solve a refine query that finds the real tuples to substitute for the same group
    - **Greedy Backtracking** if unsolvable

## Inspiration

- K-Means Clustering or Expectation-Maximization algorithm for clustering
- Maybe use the representative samples to approximate query answers
- Similar to index, build partitioning on certain attributes in advance

### Pros

- PaQL: an extension of SQL that answers high-order query, easy to understand
- SketchRefine decomposes optimization problem into smaller subproblems
- Empoy Greedy Backtracking to modify answer to be feasible
- Mostly executed under 10s

### Cons

May have false infeasible query answer
