#wait for the SQL Server to come up
sleep 15s

#run the setup script to create the DB and the schema in the DB
/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P forest2019: -d master -i setup.sql