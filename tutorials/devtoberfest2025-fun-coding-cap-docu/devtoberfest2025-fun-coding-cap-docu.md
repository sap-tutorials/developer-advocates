---
auto_validation: true
time: 15
author_name: DJ Adams
author_profile: https://github.com/qmacro
tags: [tutorial>beginner, topic>cloud]
primary_tag: topic>cloud
parser: v2
---

# 🟡 Devtoberfest 2025 - Coder's Challenge - CAP Documentation (Capire!)
<!-- description --> You don't have to code all day. Let's have some fun with a little CAP challenge.

## You will learn
- CAP documentation, known as "Capire" (Italian for "understand")
- CAP and CDS

## Prerequisites
- None

## Intro
This challenge tests your basic knowledge and understanding of the SAP Cloud Application Programming Model, and hopefully will help you become more comfortable with its documentation, known as [Capire](https://cap.cloud.sap/docs/).

The answers to each of these questions can be found in [Capire](https://cap.cloud.sap/docs/), specifically in the topic page linked in the question. They will each be one word or phrase (optionally with instructions on how that phrase should be constructed) and must be precise and case-sensitive.

Good luck!

<hr>

This challenge tutorial is part of our yearly and wonderful **Devtoberfest**, a month-long event filled with learning, fun, challenges, and prizes -- for developers by developers. 

![Devtoberfest](devtoberfestBanner2.png) 

For more info on Devtoberfest, see our [Devtoberfest group page](https://community.sap.com/t5/devtoberfest/gh-p/Devtoberfest).



### Question 1 (managed associations)

Topic page: [Definition Language (CDL)](https://cap.cloud.sap/docs/cds/cdl).

Managed associations help us keep the details of relation and constraint mechanics out of our CDS models. With to-one managed associations, required foreign key elements can be automatically added. The name of such elements is constructed from the name of the source entity's element, with the name of the target entity's element, joined with an underscore, in a sort of `source_target` form.

Consider the following CDS model:

```cds
using {cuid} from '@sap/cds/common';

service Bookshop {
  entity Books : cuid {
    title  : String;
    author : Association to Authors;
  }

  entity Authors {
    key nr   : Integer;
        name : String;
  }
}
```

What would be the name of the foreign key element generated for the managed to-one association here?

### Question 2 (extending entities)

Topic page: [Definition Language (CDL)](https://cap.cloud.sap/docs/cds/cdl).

In CDS modeling, what is the CDL keyword used to declare named definitions that are to be used to extend entities?

>**HINT:** just by the way, there's one of these types of named definitions (not explicitly declared, but) used in the CDS model above.

### Question 3 (reuse types)

Topic page: [Common Reuse Types](https://cap.cloud.sap/docs/cds/common).

Instead of each project re-inventing their own definitions for common concepts that many of them share, CAP ships with a set of types, entities and more, that each project can use instead of cluttering up their domain models with their own versions.

Entities such as `Countries`, `Currencies`, `Languages` and `Timezones` fall into this category and are themselves all extended with a common base definition which has `name` and `descr` elements.

What is the name of that base definition?

### Question 4 (authorization annotations)

Topic page: [CDS-based Authorization](https://cap.cloud.sap/docs/guides/security/authorization)

Authorization restrictions can be added declaratively to CDS models via annotations (starting with the `@` symbol). When compiled (or "mapped") into EDMX, for an OData representation and conveyance of a given service, the metadata can also contain (OData flavor) annotations. Here's an example of some annotations in EDMX, where there are three annotation terms that are applied to a `Books` entity target:

```xml
<Annotations Target="Bookshop.EntityContainer/Books">
  <Annotation Term="Capabilities.DeleteRestrictions">
    <Record Type="Capabilities.DeleteRestrictionsType">
      <PropertyValue Property="Deletable" Bool="false"/>
    </Record>
  </Annotation>
  <Annotation Term="Capabilities.InsertRestrictions">
    <Record Type="Capabilities.InsertRestrictionsType">
      <PropertyValue Property="Insertable" Bool="false"/>
    </Record>
  </Annotation>
  <Annotation Term="Capabilities.UpdateRestrictions">
    <Record Type="Capabilities.UpdateRestrictionsType">
      <PropertyValue Property="Updatable" Bool="false"/>
    </Record>
  </Annotation>
</Annotations>
```

These three annotations are in the [OData Capabilities Vocabulary](https://docs.oasis-open.org/odata/odata-vocabularies/v4.0/csprd01/odata-vocabularies-v4.0-csprd01.html#_Toc472083030) and are:

- `DeleteRestrictions`
- `InsertRestrictions`
- `UpdateRestrictions`

In other words, the only type of operation allowed on this entity is READ.

There is single annotation in CDS that, when applied, is represented in OData EDMX as exactly this set of capability annotations. What is it (make sure you include the `@` prefix when submitting your answer)?

> See [A deep dive into CDS and OData annotations](https://qmacro.org/blog/posts/2023/03/10/a-deep-dive-into-odata-and-cds-annotations/) for further reading on this subject.

### Question 5 (providing data via CSV)

Topic page: [Databases - Common](https://cap.cloud.sap/docs/guides/databases)

The [Providing Initial Data](https://cap.cloud.sap/docs/guides/databases#providing-initial-data) section of this topic page describes the ability to use CSV files to provide initial / sample data.

According to this section, initial data (for configurations, code lists and similar) is picked up by default from `data/` directories within the `db/` directory. In contrast, sample data (for tests and demos) is picked up from `data/` within a different parent directory, and is also excluded from production deployments.

What is the name of this different parent directory?

### Question 6 (CQL features)

Topic page: [Query Language (CQL)](https://cap.cloud.sap/docs/cds/cql)

CQL is a superset of SQL, and has many features that allow us to remain at a high level when thinking about how we can interact with our CDS models. One of these features is the concept of [path expressions](https://cap.cloud.sap/docs/cds/cql#path-expressions). Here are a few examples:

In a `select` clause:

```sql
SELECT *, author.address.town.name from Books;
```

In a `where` clause:

```sql
SELECT from Books where author.name='Emily Brontë'
```

In a `from` clause:

```sql
SELECT from Authors[name='Emily Brontë'].books;
```

In this last example, we see `[name='Emily Brontë']` which is another feature of CQL. What is the two word phrase that describes what this feature is?

### Question 7 (entity and type definitions)

Topic page: [Definition Language (CDL)](https://cap.cloud.sap/docs/cds/cdl)

As described in the [Entities & Type Definitions](https://cap.cloud.sap/docs/cds/cdl#entities-type-definitions) section of this topic page, we learn that entities (named structured types usually representing data that is persisted and accessed via CRUD style operations) and types (simple, or structured, or as an association) can be defined in CDL.

When defining entities or types, there is a keyword that can be used but is optional in both cases. What is that keyword?

### Question 8 (common annotations)

Topic page: [Common Annotations](https://cap.cloud.sap/docs/cds/annotations)

In an earlier question (Q4) we got to learn about a CDS annotation that maps to multiple annotations in the Capabilities Vocabulary (in the OData / EDMX context). There are other common annotations in CDS that map to [annotations in other established vocabularies](https://qmacro.org/blog/posts/2023/03/10/a-deep-dive-into-odata-and-cds-annotations/#odata-annotation-vocabularies).

For example, consider this CDS model definition:

```cds
service Bookshop {
  entity Books {
    @(
      title      : 'Identifier',
      description: 'A useless description'
    ) key ID : Integer;
    title    : String;
  }
}
```

The `@title` CDS annotation maps to the `Common.Label` annotation in EDMX, in other words to the `Label` term in the `Common` vocabulary, which happens to be a vocabulary from SAP.

The `@description` CDS annotation maps to a different term in yet another vocabulary. What is the name of it, in `Vocabulary.Term` format?

### Question 9 (the command line interface)

Topic page: [CDS Command Line Interface (CLI)](https://cap.cloud.sap/docs/tools/cds-cli)

One of the facets available in `cds add` is `data`, which helps with creating CSV headers and records for entity data.

By default it will do this for all entities, but there's an option (also sometimes known as a "switch") with which you can limit the entities which are affected by providing a name to match on. What is this option?

### Question 10 (the cds REPL)

Topic page: [CDS Command Line Interface (CLI)](https://cap.cloud.sap/docs/tools/cds-cli)

The cds REPL is a super facility to interact with CAP's JavaScript APIs in a comfortable and classic environment. To start up a CAP server when in the cds REPL, one can use the `.run` command.

What is the command line equivalent option that can be used (when invoking `cds repl`) instead (you can answer with the short or long form version of this option)?

> See [A reCAP intro to the cds REPL](https://qmacro.org/blog/posts/2025/07/21/a-recap-intro-to-the-cds-repl/) for further reading on the cds REPL.
