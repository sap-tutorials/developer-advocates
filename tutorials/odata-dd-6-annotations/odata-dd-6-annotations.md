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

The XML element structure contained within the `<Annotation>` element is the annotation term's value. [Staring at](https://qmacro.org/blog/posts/2017/02/19/the-beauty-of-recursion-and-list-machinery/#initial-recognition) this structure for a bit, we see that it's a [collection](https://docs.oasis-open.org/odata/odata/v4.0/errata03/os/complete/part3-csdl/odata-v4.0-errata03-os-part3-csdl-complete.html#_Toc453752651) of records, each of which have two properties (or fields) "rel" and "href", for which there are corresponding string values.

There's only a single record in the collection, and it looks like this:

rel|href
-|-
`author`|`https://cap.cloud.sap`

### Dig into the XML representation of the Core vocabulary

Let's go the hard way round to understand what this term is, and how the value structure is defined. To do that, we should look at the [XML representation of the Org.OData.Core.V1 vocabulary](https://oasis-tcs.github.io/odata-vocabularies/vocabularies/Org.OData.Core.V1.xml), and search for the relevant term.

> As we search, we also will notice that the schema within this resource, specifically the "Org.OData.Core.V1" schema, is adorned with a "Core.Links" annotation itself, too! And it works because of the OData namespace "Core" provides a pointer to itself. Yet more beauty, which we'll see a bit more of shortly, too.

Within the "Org.OData.Core.V1" schema, we find two elements, right next to each other, that are relevant to our search - a `<Term>` and a `<ComplexType>`:

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

Here's what that looks like, pictorally:

```text
Namespace: Core

    +-- Description: "Link to related information"
    |
    |               +-- Description: "The Link term (sic) is inspired by ..."
    V               |
+-------+    +------V----------------+ 
|       |    | +----------+          ++
| Links +--->| | Link     |          ||
|       |    | |          |          ||
+-------+    | +-+--------+          ||
             |   |     +----------+  ||
             |   +-----+ rel      |<---- Description: "Link relation type ..."
             |   |     | (String) |  ||
             |   |     +----------+  ||
             |   |     +----------+  ||
             |   +-----+ href     |<---- Description: "URL of related information ..."
             |         | (String) |<---- IsURL: true
             |         +----------+  ||
             ++----------------------+|
              +-----------------------+
                  (Collection)
```

### Explore the Core.IsURL annotation

As a bonus, and to help drive home how OData vocabularies and metadata metadata (yes, that is deliberately written twice) works, let's spend a moment of practice following the other annotation with which the "Core.Link" complex type's property "href" is annotated, namely "Core.IsURL".

Look through the [Core XML schema](https://oasis-tcs.github.io/odata-vocabularies/vocabularies/Org.OData.Core.V1.xml) for the "IsURL" term. You should find this:

```xml
<Term Name="IsURL" Type="Core.Tag" Nullable="false" DefaultValue="true" AppliesTo="Property Term">
  <Annotation Term="Core.Description" String="Properties and terms annotated with this term MUST contain a valid URL" />
  <Annotation Term="Core.RequiresType" String="Edm.String" />
</Term>
```

Descend yet one level deeper to find out what the "Core.Tag" type is, whereupon you should find:

```xml
<TypeDefinition Name="Tag" UnderlyingType="Edm.Boolean">
  <Annotation Term="Core.Description" String="This is the type to use for all tagging terms" />
</TypeDefinition>
```

And with the definition of this type being a Boolean (in the "edm" namespace, see the [Metadata](https://developers.sap.com/tutorials/odata-dd-4-metadata.html) tutorial earlier in this mission), we've bottomed out our investigation.

Tracking back up to where we started this descent, the schema in our [OData metadata document](https://odd.cfapps.eu10.hana.ondemand.com/northbreeze/$metadata), we can now confidently understand that:

Level 0 (our OData metadata)

- that schema is annotated with the "Links" term
- that "Links" term is in the Org.OData.Core.V1 vocabulary

Level 1 (the "Core" vocabulary)

- that vocabulary has the short alias "Core"
- within the "Core" vocabulary, the "Links" term is defined as a Collection of the "Link" complex type
- that "Link" complex type has two properties, "url" and "href"

Level 2 (annotations used for vocabulary content)

- the "Links" term, the "Link" complex type, and both properties are also themselves annotated with terms from "Core"
- the predominant term for these (meta) annotations within the "Core" vocabulary is "Description"
- but there's also the term "IsURL", which is defined as being of type "Tag"

Level 3 (annotations used for building blocks of annotations)

- and the "Tag" type is defined as a Boolean
- as well as being annotated (with the "Description" term)

Well done!
