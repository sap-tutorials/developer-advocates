---
parser: v2
author_name: DJ Adams
author_profile: https://github.com/qmacro
auto_validation: false
primary_tag: software-product>sap-business-technology-platform
tags: [ software-product>sap-business-technology-platform, topic>cloud, programming-tool>odata, tutorial>beginner ]
time: 20
---

# Learn how to read annotations in OData metadata documents

<!-- description --> Annotations from different vocabularies can be found throughout OData metadata documents.

## You will learn

- How annotations are defined & structured
- How annotations are used to extend the information in the schema

## Intro

In all cases, annotations consist of two parts:

- the annotation term
- the annotation value

In this tutorial we'll examine the terms, along with their types and possible values, in our [Northbreeze OData metadata document](https://odd.cfapps.eu10.hana.ondemand.com/northbreeze/$metadata).

### Dig in to the Core.Links annotation

One of the annotations we took a brief first look at in the previous tutorial was "Core.Links", where "Core" is the vocabulary alias, referring here to "Org.OData.Core.V1".

```xml
<Schema Namespace="Main" xmlns="http://docs.oasis-open.org/odata/ns/edm">
  <Annotation Term="Core.Links">
    <Collection>
      <Record>
        <PropertyValue Property="rel" String="author"/>
        <PropertyValue Property="href" String="https://cap.cloud.sap"/>
      </Record>
    </Collection>
  </Annotation>
  ...
</Schema>
```

The XML element structure contained within the `<Annotation>` element is the annotation term's value. [Staring at](https://qmacro.org/blog/posts/2017/02/19/the-beauty-of-recursion-and-list-machinery/#initial-recognition) this structure for a bit, we see that it's a collection (or array) of records, each of which have two properties (or fields) "rel" and "href", for which there are corresponding string values.

There's only a single record in the collection, and it looks like this:

rel|author
-|-
`author`|`https://cap.cloud.sap`

