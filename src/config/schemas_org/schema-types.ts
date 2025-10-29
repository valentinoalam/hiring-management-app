import type {
    BreadcrumbList,
    Organization,
    WebSite,
    WithContext,
  } from "schema-dts"
  
  export type SchemaBreadcrumb = WithContext<BreadcrumbList>
  export type SchemaOrganization = WithContext<Organization>
  export type SchemaWebsite = WithContext<WebSite>
  
  