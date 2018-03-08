<?php

class DB
{
    private $pdo;

    // Create the connection
    public function __construct($protocol, $host, $db, $user, $pass, $charset = 'utf8')
    {
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        $dsn = "$protocol:host=$host;dbname=$db;charset=$charset";

        $this->pdo = new PDO($dsn, $user, $pass, $options);
    }

    // Execute a query, throws exceptions, returns the executed statement
    public function exec($query, $data = [], $last_id = false)
    {
        $stmt = $this->pdo->prepare($query);
        $stmt->execute($data);
        if ($last_id) {
            return $this->pdo->lastInsertId();
        } else {
            return $stmt;
        }
    }

    // Execute a query and fetches the results
    public function query($query, $data = [], $first = false)
    {
        $stmt = $this->exec($query, $data);
        if (!$stmt) {
            throw new Exception($this->pdo->errorInfo());
        } else {
            $res = $stmt->fetchAll();
            if ($first) {
                return @$res[0];
            } else {
                return $res;
            }
        }
    }

    public function insert($table, $data)
    {
        $q = "INSERT INTO $table (";
        $q.= implode(',',array_keys($data));
        $q.= ") VALUES (?";
        $q.= str_repeat(',?', count($data)-1);
        $q.= ")";
        return $this->exec($q, array_values($data), true);
    }

    public function beginTransaction()
    {
        $this->pdo->beginTransaction();
    }

    public function commit()
    {
        $this->pdo->commit();
    }

    public function rollback()
    {
        $this->pdo->rollback();
    }

    public function getPDO()
    {
        return $this->pdo;
    }
}
