using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SimpleToDoApp.Domain.Entities
{
    public class Department
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public required string Name { get; set; }

        public ICollection<Account> Accounts { get; set; } = new List<Account>();
    }
}
