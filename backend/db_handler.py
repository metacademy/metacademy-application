import sqlite3

class db:
    """
    This class interfaces to a sqlite database and has convenience methods for extracting/commiting data
    """
    def __init__(self, filename):
        self.con = sqlite3.connect(filename)
        self.con.row_factory = sqlite3.Row # makes it so that we fetch dictionary type objects (efficiently)
        self.cur = self.con.cursor()
        self.loc = filename

    def __del__(self):
        self.con.commit()
        self.cur.close()
        self.con.close()

    def close(self):
        self.con.commit()
        self.cur.close()
        self.con.close()

    def get_db_loc(self):
        return self.loc

    def commit(self):
        self.con.commit()

    def fetch(self, stmt):
        self.cur.execute(stmt)
        return self.cur.fetchall()

    def execute(self, stmt, args=None):
        if args:
            self.cur.execute(stmt, args)
        else:
            self.cur.execute(stmt)
        self.commit()

    def execute_many(self, stmt, itms):
        self.cur.executemany(stmt, itms)
        self.commit()

    def check_table_existence(self, table_name):
        qry = "SELECT name FROM sqlite_master WHERE type='table' AND name='%s'" % table_name
        self.cur.execute(qry)
        return self.cur.fetchall() != []

    def add_table(self, table):
        self.cur.execute('CREATE TABLE %s' % table)
        self.commit()

    def add_index(self, index):
        self.cur.execute('CREATE INDEX %s' % index)
        self.commit()
