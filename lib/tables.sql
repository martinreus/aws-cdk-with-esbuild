create table if not exists searchable_industry (
	id varchar(63) PRIMARY KEY,
    description varchar(511),
    parent_industry_id varchar(63),

      CONSTRAINT parent_industry_id_fk FOREIGN KEY (parent_industry_id) REFERENCES searchable_industry (id)

) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;