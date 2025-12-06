namespace MediSales.API.Utilities
{
    /// <summary>Generates unique transaction codes (TXN-YYYYMMDD-XXXXX).</summary>
    public static class TransactionCodeGenerator
    {
        private static readonly object _lock = new object();
        private static int _counter = 0;
        private static string _lastDate = string.Empty;

        public static string Generate()
        {
            lock (_lock)
            {
                var currentDate = DateTime.UtcNow.ToString("yyyyMMdd");

                // Reset counter if date has changed
                if (_lastDate != currentDate)
                {
                    _counter = 0;
                    _lastDate = currentDate;
                }

                _counter++;

                return $"TXN-{currentDate}-{_counter:D5}";
            }
        }

        public static void ResetCounter()
        {
            lock (_lock)
            {
                _counter = 0;
                _lastDate = string.Empty;
            }
        }
    }
}
