---
author: Pengyu Wang
pubDatetime: 2025-03-07T22:49:06.000-05:00
modDatetime: 
title: Book Notes | A Philosophy of Software Design (APOSD)
featured: true
draft: false
tags:
  - system-design
  - notes
description: notes on the book A Philosophy of Software Design
---

This is a living document of the notes I got from the book [*A Philosophy of Software Design* (APOSD)](https://amzn.to/4ksA1i5), by the famous Computer Scientist John Ousterhout. I came across this book when checking out his [discussion on Software Engineering Principles](https://github.com/johnousterhout/aposd-vs-clean-code) with Clean Code’s author Robert “Uncle Bob” Martin. I will mentally remind myself to read that discussion (which is a Markdown file with thousands of words on Github) after finishing APOSD. This blog mainly contains a summary of the words, as well as some interspersed thoughts from my limited experience in programming. This blog will be updated as I progress.

## Introduction

- Greatest limitation in writing software → understand the system we are building
- **Complexity** accumulates → slows down development, lead to bugs
- Two approaches to fight complexity
  - Making code simpler & more obvious
  - Encapsulate complexity and provide abstractions
- Designing software = managing complexity
- Two goals of this book
  - Nature of software complexity
  - Techniques to minimize complexity

## Nature of Complexity

### Defining Complexity

- Complexity is anything related to the structure of a software system that makes it hard to understand and modify the system
- $C = \sum_p c_p \cdot t_p$, where $c_p$ is the complexity of a part and $t_p$ is the fraction of time spent working on that part
  - As long as complexity is encapsulated into a less-worked-on module, the overall complexity is well-managed
  - Reminded me of an arcane 1000-line shell script that deploys a service to AWS, nobody knows what it is doing but every one uses it for deployment
- For large systems, it is impossible to avoid complexity at all → maintain a complex module that provides easy-to-use abstraction

### Symptoms of Complexity

Three symptoms of complexity

1. **Change amplification**: a simple change requires code modifications in many places
2. **Cognitive load**: how much a developer needs to know to complete a task
3. **Unknown unknowns**: not obvious what to modify or what info required to make the change

- Change amplification and cognitive load are again impossible to avoid
  - change amplification inherent to *dependency*, which is created between modules
- Unknown unknowns
  - the worst → only find out about it when bug appears
  - inverse of change amplification and cognitive load → no way to even know the modifications / the information prerequisites

### Causes of Complexity

- **Dependency**: when code cannot be understood/modified in isolation; relates to other code
  - dependencies are unavoidable: we intentionally introduce dependencies (API, spec)
  - reduce the number of dependencies & make them simple and obvious
  - manifests as *change amplification* and *high cognitive load*
- **Obscurity**: important info not obvious
  - comes from inconsistency: inconsistent naming & usage
  - comes from inadequate documentation
    - excessive documentation → not an obvious system → needs simplification
  - manifests as *unknown unknowns* and *high cognitive load*

- Complexity is incremental → results of *dependencies* and *obscurities* building up over time
- requires *Zero-tolerance* policy against complexity
