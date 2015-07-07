CREATE TABLE taxonomy(
    SCI_NAME text UNIQUE,
    TAXON_ORDER text,
    PRIMARY_COM_NAME text UNIQUE,
    CATEGORY text,
    ORDER_NAME text,
    FAMILY_NAME text,
    SUBFAMILY_NAME text,
    GENUS_NAME text,
    SPECIES_NAME text
);
ALTER TABLE taxonomy ADD IMG_FILE text;
create materialized  view birds_with_data_v  as select distinct taxonomy.sci_name, replace(primary_com_name,'_',' ')
as primary_com_name,img_file from taxonomy join (select distinct name from sighting)
as d_sighting on d_sighting.name = taxonomy.sci_name;

