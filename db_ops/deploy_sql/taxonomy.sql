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
