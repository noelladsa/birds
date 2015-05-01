import sys

class NameFileInfo(object):
    """ Provides information related to the Ebird Name files.
    Name files contain descriptions for each field of csv data files which are
    part of the Ebird ref data set"""
    def __init__(self,file_name):
        """ """
        file = open(file_name).read()
        lines = file.split("\n")
        self.pairs = {}
        for line in lines:
            if line:
                badchars = " ."
                keyVal = [val.strip(badchars) for val in line.split(":")]
                self.pairs[keyVal[0]] = keyVal[1]

    def _get_enum_sql(self, field, description):
        desc_arr = ["'{}'".format(s) for s in description.split(",")]
        enum_sql = "CREATE TYPE " + self._get_enum_name(field) + " AS ENUM ("+",".join(desc_arr)+");"
        return enum_sql


    def get_sql_datatype(self, field,sql=[]):
        """ Returns a datatype based on the field passed """
        if field in self.pairs:                          # Ignoring data not in the name files.
            description = self.pairs[field]
            if description == "continuous":
                return "real"
            else:
                return "text"

    def get_sql_format(self, field, data):
        """ Changes the data format depending on the field data type"""
        sql_type = self.get_sql_datatype(field)
        if data == "?":
            return None
        if sql_type == "text":
            return "'{}'".format(data)
        return data

    def get_sql(self, table):
        sql = []
        table_fields = ["\"{}\"".format(key)+ " " + self.get_sql_datatype(key, sql) for key in self.pairs]
        table_sql = "CREATE TABLE " + table.lower() + "(\n" + ",".join(table_fields)+ "\n);"
        sql.append(table_sql)
        return sql

if __name__ == "__main__":
    name = sys.argv[1]
    file_name = sys.argv[2]
    file_data = NameFileInfo(file_name)
    sql = file_data.get_sql(name)
    sql_file = open(name+".sql", "w")
    sql_file.write("\n".join(sql))
