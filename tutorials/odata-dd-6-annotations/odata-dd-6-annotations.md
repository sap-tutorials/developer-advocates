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

### Revisit the Core.Links annotation

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

rel|href
-|-
`author`|`https://cap.cloud.sap`

### Dig into the XML representation of the Core vocabulary

Let's go the hard way round to understand what this term is, and how the value structure is defined. To do that, we should look at the [XML representation of the Org.OData.Core.V1 vocabulary](https://oasis-tcs.github.io/odata-vocabularies/vocabularies/Org.OData.Core.V1.xml), and search for the relevant term.

> As we search, we also will notice that the schema within this resource, specifically the "Org.OData.Core.V1" schema, is adorned with a "Core.Links" annotation itself, too! And it works because of the OData namespace "Core" provides a pointer to itself. Yet more beauty, which we'll see a bit more of shortly, too.

Within the "Org.OData.Core.V1" schema, we find two key elements, right next to each other, that are relevant to our search - a `<Term>` and a `<ComplexType>`:

```xml
<Term Name="Links" Type="Collection(Core.Link)" Nullable="false">
  <Annotation Term="Core.Description" String="Link to related information" />
</Term>
<ComplexType Name="Link">
  <Annotation Term="Core.Description" String="The Link term is inspired by the `atom:link` element, see [RFC4287](https://tools.ietf.org/html/rfc4287#section-4.2.7), and the `Link` HTTP header, see [RFC5988](https://tools.ietf.org/html/rfc5988)" />
  <Property Name="rel" Type="Edm.String" Nullable="false">
    <Annotation Term="Core.Description" String="Link relation type, see [IANA Link Relations](http://www.iana.org/assignments/link-relations/link-relations.xhtml)" />
  </Property>
  <Property Name="href" Type="Edm.String" Nullable="false">
    <Annotation Term="Core.IsURL" />
    <Annotation Term="Core.Description" String="URL of related information" />
  </Property>
</ComplexType>
```

This is where the "Links" term, in the "Core" namespace (representing the vocabulary), is defined, in a `<Term>` element. What can we discern?

- the `<Term>` element is defined in the OData standards document that has accompanied us on this journey of discovery: "OData Version 4.0. Part 3: Common Schema Definition Language (CSDL)", specifically in [section 14.1 Element edm:Term](https://docs.oasis-open.org/odata/odata/v4.0/errata03/os/complete/part3-csdl/odata-v4.0-errata03-os-part3-csdl-complete.html#_Toc453752620)
- the term's type is defined as being a collection (an array) of individual "Core.Link" items
- it is annotated with a "Core.Description" term (which is a part of this very vocabulary, more beauty!) that tells us this term is for links to related information

The "Core.Link" item is defined with a corresponding `<ComplexType>` element, which:

- is annotated with a "Core.Description" term telling us more about it 
- includes, in that description, a reference to the `atom` namespace and RFC 4287 (Atom Syndication Format) which we looked at in the first tutorial in this mission on the [Origins](https://developers.sap.com/tutorials/odata-dd-1-origins.html) of OData
- is defined as having two properties "rel" and "href", each of which has the type "edm.String" and each of which are also annotated with "Core.Description"

### Explore the Core.IsURL annotation

As a bonus, and to help drive home how OData vocabularies and metadata metadata (yes, that is deliberately written twice) works, let's spend a moment of practice following the other annotation with which the "Core.Link" complex type's property "href" is annotated, namely "Core.IsURL".
